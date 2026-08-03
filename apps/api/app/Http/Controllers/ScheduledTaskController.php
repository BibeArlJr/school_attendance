<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Modules\Attendance\Models\AttendanceEvent;
use App\Modules\Attendance\Models\AttendanceRecord;
use App\Modules\Attendance\Models\SchoolCalendar;
use App\Modules\Attendance\Models\SchoolConfig;
use App\Modules\IdCard\Models\IdCard;
use App\Modules\Import\Models\ImportBatch;
use App\Modules\ParentGuardian\Models\ParentGuardian;
use App\Modules\ParentGuardian\Models\StudentParentLink;
use App\Modules\School\Models\AcademicYear;
use App\Modules\School\Models\School;
use App\Modules\Sms\Models\SmsLog;
use App\Modules\Staff\Models\Staff;
use App\Modules\Student\Models\Student;
use App\Modules\Student\Models\StudentEnrollment;
use App\Support\Concerns\BelongsToSchool;
use App\Support\Enums\UserRole;
use App\Support\Responses\ApiResponse;
use App\Support\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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

    /**
     * TEMPORARY, READ-ONLY diagnostic (re-diagnose-real-rejection prompt)
     * — a real production scan was rejected, contradicting an earlier
     * "verified working" report. Reports the EXACT stored barcode_value
     * for a given student (byte length + hex dump, to catch invisible
     * whitespace a visual check would miss), whether AttendanceService::
     * processScan()'s own normalization (strtoupper+trim) would find it,
     * and — critically — the id_card's own status and the owning
     * school's active/license state, since IdCard::query()->where(
     * 'school_id', $schoolId)->where('barcode_value', $barcodeValue) in
     * that method fails silently (returns UnknownBarcode) for reasons
     * that have nothing to do with case: a school_id mismatch, a
     * deactivated card, or a suspended school are all real, distinct,
     * unrelated failure modes this checks for directly rather than
     * assuming it's the same case-sensitivity issue as before.
     */
    public function lookupBarcode(Request $request): JsonResponse
    {
        $rawInput = (string) $request->query('barcode', 'bindhya-STD-002401');
        $normalized = mb_strtoupper(trim($rawInput));

        // Two independent lookups, deliberately not one — the whole point
        // is telling apart "genuinely doesn't exist anywhere" from
        // "exists, but not under the uppercase value a real scan would
        // normalize to and query for".
        $normalizedMatch = IdCard::withoutGlobalScope(BelongsToSchool::class)
            ->where('barcode_value', $normalized)
            ->with(['school:id,name,school_code,is_active,license_status,amc_expiry_date'])
            ->first();
        $exactCaseMatch = IdCard::withoutGlobalScope(BelongsToSchool::class)
            ->where('barcode_value', $rawInput)
            ->with(['school:id,name,school_code,is_active,license_status,amc_expiry_date'])
            ->first();

        $idCard = $normalizedMatch ?? $exactCaseMatch;

        if (! $idCard) {
            return ApiResponse::success([
                'input' => $rawInput,
                'normalized_input' => $normalized,
                'found_via_normalized_match' => false,
                'found_via_exact_case_match' => false,
                'note' => 'No id_cards row matches this barcode_value at all, under either form, in ANY school — genuinely unknown, not a school-scoping or casing issue.',
            ]);
        }

        $student = Student::withoutGlobalScope(BelongsToSchool::class)->find($idCard->owner_id);

        // Scope/severity check: how many OTHER cards in this same school
        // also have a barcode_value that isn't already all-uppercase —
        // tells apart "this one row is a fluke" from "the whole import
        // stored these wrong".
        $nonUppercaseSiblingCount = IdCard::withoutGlobalScope(BelongsToSchool::class)
            ->where('school_id', $idCard->school_id)
            ->whereRaw('barcode_value != UPPER(barcode_value)')
            ->count();

        return ApiResponse::success([
            'input' => $rawInput,
            'normalized_input' => $normalized,
            'found_via_normalized_match' => (bool) $normalizedMatch,
            'found_via_exact_case_match' => (bool) $exactCaseMatch,
            'stored_barcode_value' => $idCard->barcode_value,
            'stored_barcode_is_all_uppercase' => $idCard->barcode_value === mb_strtoupper($idCard->barcode_value),
            'stored_barcode_byte_length' => strlen($idCard->barcode_value),
            'stored_barcode_hex' => bin2hex($idCard->barcode_value),
            'id_card_status' => $idCard->status->value,
            'id_card_school_id' => $idCard->school_id,
            'other_non_uppercase_barcodes_in_same_school' => $nonUppercaseSiblingCount,
            'school' => $idCard->school ? [
                'id' => $idCard->school->id,
                'name' => $idCard->school->name,
                'school_code' => $idCard->school->school_code,
                'is_active' => $idCard->school->is_active,
                // The real, computed source of truth (School::
                // licenseStatus()), not the stored license_status column,
                // which only records the last explicit activation and can
                // drift stale (see that method's own docblock).
                'license_status' => $idCard->school->licenseStatus()->value,
                'amc_expiry_date' => $idCard->school->amc_expiry_date?->toDateString(),
            ] : null,
            'student' => $student ? [
                'id' => $student->id,
                'uuid' => $student->uuid,
                'name' => trim("{$student->first_name} {$student->last_name}"),
                'status' => $student->status->value,
                'school_id' => $student->school_id,
            ] : null,
        ]);
    }

    /**
     * TEMPORARY, READ-ONLY diagnostic (diagnose-then-wipe-demo-school
     * prompt, PART A) — reports exact real counts for every category the
     * planned wipe would touch, scoped to whichever school is named
     * "Demo School", plus a same-shape baseline for one other real school
     * so its counts can be re-checked unchanged after the wipe. Deletes
     * nothing. A second endpoint (executeDemoSchoolWipe) only exists
     * after this report is reviewed and explicitly confirmed.
     */
    public function diagnoseDemoSchoolWipe(): JsonResponse
    {
        $matches = School::query()->where('name', 'Demo School')->get(['id', 'name', 'school_code', 'is_active']);

        if ($matches->count() !== 1) {
            return ApiResponse::error(
                'Expected exactly one school named "Demo School" — refusing to guess which one.',
                ['matches' => $matches],
                409,
            );
        }

        $school = $matches->first();
        $schoolId = $school->id;

        $studentIds = Student::withoutGlobalScope(BelongsToSchool::class)->where('school_id', $schoolId)->pluck('id');

        $studentEnrollments = StudentEnrollment::query()->whereIn('student_id', $studentIds)->count();
        $idCardsStudent = IdCard::withoutGlobalScope(BelongsToSchool::class)
            ->where('school_id', $schoolId)->where('owner_type', 'student')->count();
        $studentParentLinks = StudentParentLink::query()->whereIn('student_id', $studentIds)->count();

        $guardianIds = ParentGuardian::withoutGlobalScope(BelongsToSchool::class)->where('school_id', $schoolId)->pluck('id');
        $guardianLinksToOtherSchoolStudents = StudentParentLink::query()
            ->whereIn('parent_id', $guardianIds)
            ->whereNotIn('student_id', function ($q) use ($schoolId) {
                $q->select('id')->from('students')->where('school_id', $schoolId);
            })
            ->count();

        $baseline = null;
        $otherSchool = School::query()->where('id', '!=', $schoolId)->orderBy('id')->first(['id', 'name']);
        if ($otherSchool) {
            $otherStudentIds = Student::withoutGlobalScope(BelongsToSchool::class)->where('school_id', $otherSchool->id)->pluck('id');
            $baseline = [
                'school_id' => $otherSchool->id,
                'school_name' => $otherSchool->name,
                'students' => $otherStudentIds->count(),
                'attendance_records' => AttendanceRecord::withoutGlobalScope(BelongsToSchool::class)->where('school_id', $otherSchool->id)->count(),
                'sms_logs' => SmsLog::withoutGlobalScope(BelongsToSchool::class)->where('school_id', $otherSchool->id)->count(),
                'staff' => Staff::withoutGlobalScope(BelongsToSchool::class)->where('school_id', $otherSchool->id)->count(),
            ];
        }

        return ApiResponse::success([
            'school' => $school,
            'to_be_deleted' => [
                'students' => $studentIds->count(),
                'student_enrollments' => $studentEnrollments,
                'id_cards_student_owned' => $idCardsStudent,
                'student_parent_links' => $studentParentLinks,
                'parent_guardians' => $guardianIds->count(),
                'attendance_events' => AttendanceEvent::withoutGlobalScope(BelongsToSchool::class)->where('school_id', $schoolId)->count(),
                'attendance_records' => AttendanceRecord::withoutGlobalScope(BelongsToSchool::class)->where('school_id', $schoolId)->count(),
                'sms_logs' => SmsLog::withoutGlobalScope(BelongsToSchool::class)->where('school_id', $schoolId)->count(),
                'import_batches' => ImportBatch::withoutGlobalScope(BelongsToSchool::class)->where('school_id', $schoolId)->count(),
            ],
            'guardian_links_pointing_to_other_school_students' => $guardianLinksToOtherSchoolStudents,
            'to_be_preserved' => [
                'staff' => Staff::withoutGlobalScope(BelongsToSchool::class)->where('school_id', $schoolId)->count(),
                'admin_and_guard_users' => User::query()->where('school_id', $schoolId)->whereIn('role', [UserRole::Admin, UserRole::Guard])->count(),
                'school_configs' => SchoolConfig::query()->where('school_id', $schoolId)->count(),
                'school_calendars' => SchoolCalendar::query()->where('school_id', $schoolId)->count(),
                'academic_years' => AcademicYear::query()->where('school_id', $schoolId)->count(),
            ],
            'other_school_baseline' => $baseline,
        ]);
    }
}
