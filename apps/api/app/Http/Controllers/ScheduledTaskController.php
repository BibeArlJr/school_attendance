<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Modules\Import\Models\ImportBatch;
use App\Modules\Student\Models\Student;
use App\Support\Concerns\BelongsToSchool;
use App\Support\Enums\UserRole;
use App\Support\Responses\ApiResponse;
use App\Support\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Str;

/**
 * POST /api/tasks/* (Prompt 55 Part E) — triggered by an external
 * cron-ping service or a GitHub Actions scheduled workflow, standing in
 * for Render's Cron Jobs (not free-tier eligible). Every action here is
 * guarded by VerifyScheduledTaskSecret rather than auth:sanctum — the
 * caller is an external trigger (or, for resetSuperAdminPassword, an
 * operator with no other way in), not a logged-in user.
 */
class ScheduledTaskController extends Controller
{
    public function sendLicenseReminders(): JsonResponse
    {
        $exitCode = Artisan::call('app:send-license-reminders');

        return ApiResponse::success(
            ['output' => trim(Artisan::output())],
            'Command executed.',
            $exitCode === 0 ? 200 : 500,
        );
    }

    /**
     * Standing recovery mechanism (not a one-off script) for the exact
     * lockout scenario Render's free tier makes otherwise unrecoverable:
     * the super_admin password was only ever shown once, in deploy logs
     * (CreateSuperAdmin), and there's no Shell to reset it by hand.
     * Deliberately NOT run automatically at boot (unlike
     * CreateSuperAdmin itself) — resetting a real password on every
     * redeploy would be a standing security hole, not a recovery tool.
     * Requires the same shared secret as every other /api/tasks/*
     * endpoint (VerifyScheduledTaskSecret) — safe to return the new
     * password directly in the response, since only a caller who
     * already holds that secret ever sees it.
     */
    public function resetSuperAdminPassword(): JsonResponse
    {
        $superAdmins = User::query()->where('role', UserRole::SuperAdmin)->get();

        if ($superAdmins->isEmpty()) {
            return ApiResponse::error('No super_admin account exists to reset.', null, 404);
        }

        // CreateSuperAdmin's own guard means there should only ever be
        // one — if that's somehow no longer true, resetting the wrong
        // one silently would be worse than just refusing and asking for
        // this to be resolved deliberately instead of guessed at.
        if ($superAdmins->count() > 1) {
            return ApiResponse::error(
                'More than one super_admin account exists — refusing to guess which one to reset.',
                ['emails' => $superAdmins->pluck('email')],
                409,
            );
        }

        $superAdmin = $superAdmins->first();
        $newPassword = Str::password(20);
        $superAdmin->update(['password' => $newPassword]);

        app(AuditLogger::class)->log(
            'user.super_admin_password_reset',
            'user',
            $superAdmin->id,
            null,
            null,
            null,
        );

        return ApiResponse::success([
            'email' => $superAdmin->email,
            'password' => $newPassword,
        ], 'Super admin password reset. Store this password now — it will not be shown again.');
    }

    /**
     * TEMPORARY one-off data-correction endpoint — fixes the real
     * production super_admin account's email, which was auto-generated
     * as the syntactically-invalid `superadmin@localhost` (see
     * CreateSuperAdmin::resolveEmail()'s fix, same prompt). Not a
     * standing feature like resetSuperAdminPassword: this is meant to
     * be removed again in a follow-up commit immediately after it's
     * run once against the real database, since Render's free tier
     * gives no other way to reach that database directly (no Shell).
     * Never touches the password — only the email column — and proves
     * that server-side rather than trusting the caller to notice.
     */
    public function fixSuperAdminEmail(): JsonResponse
    {
        $superAdmins = User::query()->where('role', UserRole::SuperAdmin)->get();

        if ($superAdmins->isEmpty()) {
            return ApiResponse::error('No super_admin account exists to fix.', null, 404);
        }

        if ($superAdmins->count() > 1) {
            return ApiResponse::error(
                'More than one super_admin account exists — refusing to guess which one to fix.',
                ['emails' => $superAdmins->pluck('email')],
                409,
            );
        }

        $superAdmin = $superAdmins->first();
        $before = ['email' => $superAdmin->email, 'password_hash' => $superAdmin->getRawOriginal('password')];

        $superAdmin->update(['email' => 'skytouchit@solution.com']);
        $superAdmin->refresh();

        $after = ['email' => $superAdmin->email, 'password_hash' => $superAdmin->getRawOriginal('password')];

        app(AuditLogger::class)->log(
            'user.super_admin_email_corrected',
            'user',
            $superAdmin->id,
            ['email' => $before['email']],
            ['email' => $after['email']],
            null,
        );

        return ApiResponse::success([
            'email_before' => $before['email'],
            'email_after' => $after['email'],
            'password_hash_unchanged' => $before['password_hash'] === $after['password_hash'],
        ], 'Super admin email corrected.');
    }

    /**
     * TEMPORARY, READ-ONLY diagnostic endpoint (double-submit-import
     * cleanup prompt, Part B) — never writes anything. Reports total
     * student count, likely duplicate groups (same school + name + DOB
     * + guardian phone, more than one row), and import_batches' real
     * state, so Part C's cleanup only ever acts on findings actually
     * reviewed against real data rather than assumptions. Meant to be
     * removed again in a follow-up commit once its findings have been
     * reviewed and (if needed) acted on — same one-time-tool discipline
     * as fixSuperAdminEmail above.
     */
    public function diagnoseDuplicateStudents(): JsonResponse
    {
        $students = Student::withoutGlobalScope(BelongsToSchool::class)
            ->with(['idCard', 'parentLinks.parentGuardian', 'school:id,name'])
            ->get();

        $groups = $students->groupBy(function (Student $student) {
            $guardianPhone = $student->parentLinks->first()?->parentGuardian?->phone ?? 'no-guardian';

            return implode('|', [
                $student->school_id,
                mb_strtolower(trim($student->first_name)),
                mb_strtolower(trim($student->last_name)),
                $student->dob?->toDateString() ?? 'no-dob',
                mb_strtolower(trim($guardianPhone)),
            ]);
        });

        $duplicateGroups = $groups->filter(fn ($group) => $group->count() > 1)->values();

        $duplicateReport = $duplicateGroups->map(function ($group) {
            $first = $group->first();

            return [
                'school_id' => $first->school_id,
                'school_name' => $first->school?->name,
                'name' => trim("{$first->first_name} {$first->last_name}"),
                'dob' => $first->dob?->toDateString(),
                'guardian_phone' => $first->parentLinks->first()?->parentGuardian?->phone,
                'copy_count' => $group->count(),
                'copies' => $group->map(fn (Student $s) => [
                    'id' => $s->id,
                    'uuid' => $s->uuid,
                    'barcode_value' => $s->idCard?->barcode_value,
                    'import_batch_id' => $s->import_batch_id,
                    'created_at' => $s->created_at?->toDateTimeString(),
                ])->values(),
            ];
        })->values();

        $batches = ImportBatch::withoutGlobalScope(BelongsToSchool::class)
            ->select(['id', 'school_id', 'file_name', 'status', 'total_rows', 'imported_count', 'skipped_count', 'created_at'])
            ->orderBy('id')
            ->get();

        // Real, direct evidence of double-processing on a specific batch
        // row: imported_count can never legitimately exceed total_rows
        // under correct single-pass processing.
        $suspiciousBatches = $batches->filter(fn ($b) => $b->imported_count > $b->total_rows)->values();

        return ApiResponse::success([
            'total_students' => $students->count(),
            'duplicate_group_count' => $duplicateReport->count(),
            'duplicate_groups' => $duplicateReport,
            'import_batches' => [
                'total_count' => $batches->count(),
                'status_counts' => $batches->countBy(fn ($b) => $b->status->value),
                'suspicious_imported_count_exceeds_total_rows' => $suspiciousBatches,
                'all_batches' => $batches,
            ],
        ]);
    }
}
