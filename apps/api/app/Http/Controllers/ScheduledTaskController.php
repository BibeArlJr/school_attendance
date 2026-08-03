<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Modules\IdCard\Models\IdCard;
use App\Modules\Import\Models\ImportBatch;
use App\Modules\School\Models\School;
use App\Modules\Sms\Models\SmsLog;
use App\Modules\Sms\Models\SmsProviderConfig;
use App\Modules\Student\Models\Student;
use App\Support\Concerns\BelongsToSchool;
use App\Support\Enums\UserRole;
use App\Support\Models\AuditLog;
use App\Support\Responses\ApiResponse;
use App\Support\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Http;
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
     * TEMPORARY, READ-ONLY diagnostic (correlate-failed-sms-against-
     * credit-consumption prompt) — reconciles whether two failed
     * production sms_logs rows ("No active SMS provider credentials
     * configured", ~12:02/12:03pm) could have consumed real Sparrow
     * credit. RealSparrowSmsService::send() returns from that failure
     * branch before ever calling Http::post() (confirmed by reading the
     * method directly), so the real question this answers is whether the
     * numbers actually reconcile: every real (non-mock) successful send's
     * timestamp, plus exactly when real credentials were set in this
     * environment (the sms_provider_config.credentials_set audit
     * action), reported together so the two failed entries' timestamps
     * can be checked against both without guessing.
     */
    public function correlateFailedSms(): JsonResponse
    {
        $failedNoCredentials = SmsLog::withoutGlobalScope(BelongsToSchool::class)
            ->where('status', 'failed')
            ->where('provider_response_message', 'like', '%credentials configured%')
            ->orderBy('sent_at')
            ->get(['id', 'school_id', 'recipient_phone', 'provider_response_code', 'provider_response_message', 'sent_at']);

        $realSends = SmsLog::withoutGlobalScope(BelongsToSchool::class)
            ->where('status', 'sent')
            ->where('provider_response_message', '!=', 'Mock send — no real gateway called.')
            ->orderBy('sent_at')
            ->get(['id', 'school_id', 'message', 'provider_response_code', 'provider_response_message', 'sent_at'])
            ->map(fn (SmsLog $log) => [
                'id' => $log->id,
                'school_id' => $log->school_id,
                'sent_at' => $log->sent_at?->toDateTimeString(),
                'provider_response_code' => $log->provider_response_code,
                'provider_response_message' => $log->provider_response_message,
                'message_char_length' => mb_strlen($log->message),
                'message_is_ascii' => mb_check_encoding($log->message, 'ASCII'),
            ]);

        $credentialsSetEvents = AuditLog::query()
            ->where('action', 'sms_provider_config.credentials_set')
            ->orderBy('created_at')
            ->get(['id', 'created_at', 'entity_id']);

        $config = SmsProviderConfig::withoutGlobalScope(BelongsToSchool::class)
            ->where('provider_name', 'sparrow')
            ->where('is_active', true)
            ->whereNull('school_id')
            ->first();

        $liveSparrowBalance = null;

        if ($config && ! empty($config->credentials['token'])) {
            $response = Http::get('https://api.sparrowsms.com/v2/credit/', ['token' => $config->credentials['token']]);
            $liveSparrowBalance = $response->json();
        }

        return ApiResponse::success([
            'failed_no_credentials_entries' => $failedNoCredentials,
            'real_non_mock_sends' => $realSends,
            'real_non_mock_sends_count' => $realSends->count(),
            'credentials_set_audit_events' => $credentialsSetEvents,
            'live_sparrow_balance' => $liveSparrowBalance,
        ]);
    }
}
