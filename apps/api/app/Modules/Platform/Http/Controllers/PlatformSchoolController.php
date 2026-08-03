<?php

namespace App\Modules\Platform\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Platform\Http\Requests\StorePlatformSchoolRequest;
use App\Modules\Platform\Services\PlatformSchoolService;
use App\Modules\School\Models\School;
use App\Modules\Student\Models\Student;
use App\Support\Concerns\BelongsToSchool;
use App\Support\Enums\LicenseStatus;
use App\Support\Exceptions\DeleteBlockedException;
use App\Support\Responses\ApiResponse;
use App\Support\Services\AuditLogger;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PlatformSchoolController extends Controller
{
    public function __construct(
        private readonly PlatformSchoolService $schoolService,
        private readonly AuditLogger $auditLogger,
    ) {
    }

    /**
     * Every school on the platform — not scoped by CurrentSchoolResolver
     * at all, deliberately: this is the one place that's meant to see
     * across every tenant at once.
     */
    public function index(): JsonResponse
    {
        $schools = School::query()
            ->withCount([
                'users as staff_count' => fn ($query) => $query->whereIn('role', ['admin', 'teacher', 'guard']),
                // Deliberate, explicit bypass (Prompt 40): this is one of
                // the two places (alongside the school list itself)
                // meant to see every school's count in the same
                // response — the withCount subquery would otherwise
                // inherit Student's new tenant scope and, since it's
                // already correlated on students.school_id = schools.id,
                // end up double-filtered against whichever single
                // school (if any) the acting super_admin happens to
                // have selected as their own active_school_id, zeroing
                // out every other row's count.
                'students as students_count' => fn ($query) => $query
                    ->withoutGlobalScope(BelongsToSchool::class)
                    ->where('status', 'active'),
            ])
            ->orderBy('name')
            ->get();

        return ApiResponse::success($schools->map(fn (School $school) => $this->withLicense($school)));
    }

    public function show(School $school): JsonResponse
    {
        $school->loadCount([
            'users as staff_count' => fn ($query) => $query->whereIn('role', ['admin', 'teacher', 'guard']),
            // Same deliberate bypass as index() above.
            'students as students_count' => fn ($query) => $query
                ->withoutGlobalScope(BelongsToSchool::class)
                ->where('status', 'active'),
        ]);

        return ApiResponse::success($this->withLicense($school));
    }

    public function store(StorePlatformSchoolRequest $request): JsonResponse
    {
        $result = $this->schoolService->create($request->validated());

        return ApiResponse::success([
            'school' => $this->withLicense($result['school']),
            'admin_email' => $result['admin']->email,
            'temporary_password' => $result['temporary_password'],
        ], 'School created successfully.', 201);
    }

    /**
     * Sets the session-equivalent "which school am I looking at" for a
     * super_admin — persisted on their own user row (active_school_id),
     * not a PHP session (this API is stateless Bearer-token auth, ADR
     * 0002 — no cookie-based session middleware on the api routes for a
     * plain session() call to reliably persist against).
     */
    public function setActive(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'school_id' => ['required', 'integer', Rule::exists('schools', 'id')],
        ]);

        $user = $request->user();
        $user->update(['active_school_id' => $validated['school_id']]);

        return ApiResponse::success(
            School::query()->findOrFail($validated['school_id']),
            'Active school updated.',
        );
    }

    /**
     * Extends from the current expiry if the school isn't expired yet
     * (an early renewal shouldn't waste the time already paid for);
     * starts fresh from today otherwise (Prompt 25 Part C — this
     * specific rule was a judgment call, reported rather than asked
     * about). license_status is set to reflect the activation itself;
     * it's never what enforcement/display actually reads (that's always
     * School::licenseStatus(), computed live from amc_expiry_date).
     *
     * `days` parameterizes the quick-duration buttons (+7/+30/+90/+365 —
     * Prompt 26 Part C revision); defaults to 365 so this stays
     * backward-compatible with the original single "Activate
     * Subscription" action from Prompt 25.
     */
    public function activateSubscription(Request $request, School $school): JsonResponse
    {
        $validated = $request->validate([
            'days' => ['sometimes', 'integer', Rule::in([7, 30, 90, 365])],
        ]);
        $days = $validated['days'] ?? 365;

        $notYetExpired = $school->amc_expiry_date !== null
            && $school->licenseStatus() !== LicenseStatus::Expired;

        $base = $notYetExpired ? Carbon::parse($school->amc_expiry_date) : Carbon::today();
        $before = ['amc_expiry_date' => $school->amc_expiry_date?->toDateString(), 'license_status' => $school->license_status->value];

        $school->update([
            'amc_expiry_date' => $base->copy()->addDays($days)->toDateString(),
            'license_status' => LicenseStatus::Active,
        ]);
        // New period starts now (Prompt 33 Part A) — last period's
        // reminder sends must not suppress this period's.
        $school->resetReminders();
        $school->save();

        $this->auditLogger->log(
            'license.activated',
            'school',
            $school->id,
            $before,
            ['amc_expiry_date' => $school->amc_expiry_date->toDateString(), 'license_status' => $school->license_status->value, 'days' => $days],
            $school->id,
        );

        return ApiResponse::success($this->withLicense($school->fresh()), 'Subscription extended.');
    }

    /**
     * Manual expiry override (Prompt 26 Part C revision) — unlike
     * activateSubscription above, this sets amc_expiry_date literally to
     * whatever date is given, with no "extend from the later of now/
     * current expiry" logic. That's what makes shortening an active
     * subscription possible: pass a date earlier than the current one
     * and it's simply set, no separate "reduce" action needed.
     */
    public function updateSubscriptionExpiry(Request $request, School $school): JsonResponse
    {
        $validated = $request->validate([
            'amc_expiry_date' => ['required', 'date'],
        ]);
        $before = ['amc_expiry_date' => $school->amc_expiry_date?->toDateString(), 'license_status' => $school->license_status->value];

        $school->update([
            'amc_expiry_date' => Carbon::parse($validated['amc_expiry_date'])->toDateString(),
            'license_status' => LicenseStatus::Active,
        ]);
        // Same reset as activateSubscription() above — a manual expiry
        // change is still a renewal from the reminder system's point of
        // view (Prompt 33 Part A).
        $school->resetReminders();
        $school->save();

        $this->auditLogger->log(
            'license.expiry_updated',
            'school',
            $school->id,
            $before,
            ['amc_expiry_date' => $school->amc_expiry_date->toDateString(), 'license_status' => $school->license_status->value],
            $school->id,
        );

        return ApiResponse::success($this->withLicense($school->fresh()), 'Subscription expiry updated.');
    }

    /**
     * Sets amc_expiry_date to yesterday, not today — School::daysUntilExpiry()
     * treats a same-day expiry as still within the Grace window (Prompt 25's
     * GRACE_DAYS check is `<=`), which would NOT trip EnsureLicenseActive's
     * write-blocking (that only fires on the computed Expired status, never
     * Grace). Since amc_expiry_date is date-only (no time component), the
     * only way to make "cancel right now" actually produce an immediate,
     * genuinely-Expired status — the same enforcement natural expiry
     * triggers — is to date it one full day in the past.
     */
    public function cancelSubscription(School $school): JsonResponse
    {
        $before = ['amc_expiry_date' => $school->amc_expiry_date?->toDateString(), 'license_status' => $school->license_status->value];

        $school->update([
            'amc_expiry_date' => Carbon::yesterday()->toDateString(),
            'license_status' => LicenseStatus::Expired,
        ]);

        $this->auditLogger->log(
            'license.cancelled',
            'school',
            $school->id,
            $before,
            ['amc_expiry_date' => $school->amc_expiry_date->toDateString(), 'license_status' => $school->license_status->value],
            $school->id,
        );

        return ApiResponse::success($this->withLicense($school->fresh()), 'Subscription canceled.');
    }

    /**
     * Platform-level suspension (Prompt 35 Part E) — orthogonal to
     * license_status/amc_expiry_date, and deliberately more severe: it
     * blocks 100% of login for that school's users, including their own
     * admin, where an expired license still allows read-only login. No
     * data touched beyond the one flag — see School::deactivate().
     */
    public function deactivate(School $school): JsonResponse
    {
        $before = ['is_active' => $school->is_active];
        $school->deactivate();
        $this->auditLogger->log('school.deactivated', 'school', $school->id, $before, ['is_active' => false], $school->id);

        return ApiResponse::success($this->withLicense($school->fresh()), 'School deactivated.');
    }

    public function reactivate(School $school): JsonResponse
    {
        $before = ['is_active' => $school->is_active];
        $school->reactivate();
        $this->auditLogger->log('school.reactivated', 'school', $school->id, $before, ['is_active' => true], $school->id);

        return ApiResponse::success($this->withLicense($school->fresh()), 'School reactivated.');
    }

    /**
     * See PlatformSchoolService::destroy() for the two gates this
     * enforces (must already be deactivated, must have zero real
     * students/staff) — this action only exists to undo a mistaken
     * school creation, not to remove a real school's data.
     */
    public function destroy(School $school): JsonResponse
    {
        try {
            $this->schoolService->destroy($school);
        } catch (DeleteBlockedException $e) {
            return ApiResponse::error($e->getMessage(), null, 422);
        }

        return ApiResponse::success(null, 'School deleted.');
    }

    /**
     * @return array<string, mixed>
     */
    private function withLicense(School $school): array
    {
        return [
            ...$school->toArray(),
            'computed_license_status' => $school->licenseStatus()->value,
            'days_until_expiry' => $school->daysUntilExpiry(),
        ];
    }
}
