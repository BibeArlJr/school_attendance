<?php

namespace App\Modules\Settings\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Attendance\Models\SchoolConfig;
use App\Modules\School\Models\AcademicYear;
use App\Modules\School\Models\School;
use App\Modules\Settings\Http\Requests\UpdateAttendanceConfigRequest;
use App\Modules\Settings\Http\Requests\UpdateSchoolProfileRequest;
use App\Modules\Settings\Http\Requests\UploadSchoolLogoRequest;
use App\Support\Responses\ApiResponse;
use App\Support\Services\AuditLogger;
use App\Support\Services\CurrentSchoolResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SettingsController extends Controller
{
    public function __construct(
        private readonly CurrentSchoolResolver $schoolResolver,
        private readonly AuditLogger $auditLogger,
    ) {
    }

    public function school(Request $request): JsonResponse
    {
        $schoolId = $this->schoolResolver->resolve($request->user());

        return ApiResponse::success(School::query()->findOrFail($schoolId));
    }

    /**
     * school_code is never written here — only the fields
     * UpdateSchoolProfileRequest actually validates are ever passed to
     * update(), so a school_code sent in the request body is silently
     * dropped rather than merely unvalidated. It's embedded in every
     * already-issued barcode (Prompt 16); changing it after cards exist
     * would break every barcode already in the field.
     */
    public function updateSchool(UpdateSchoolProfileRequest $request): JsonResponse
    {
        $schoolId = $this->schoolResolver->resolve($request->user());
        $school = School::query()->findOrFail($schoolId);
        $before = $school->only(array_keys($request->validated()));
        $school->update($request->validated());

        $this->auditLogger->log('settings.school_profile_updated', 'school', $school->id, $before, $request->validated(), $schoolId);

        return ApiResponse::success($school->fresh(), 'School profile updated successfully.');
    }

    /**
     * Stores under logos/{school_id}/ on the persistent uploads disk
     * (Backblaze B2 — config('filesystems.uploads_disk'), replacing
     * Render's ephemeral container filesystem the 'public' disk used to
     * point at) and deletes the previously-stored file, if any, so
     * re-uploading doesn't leave orphaned files behind. Only ever touches
     * logo_url — never school_id-scoped to any other school's file, since
     * $schoolId is always resolved from the authenticated user's own
     * current-school context.
     *
     * logo_url is stored as this app's own showLogo route, not a raw B2
     * URL — the B2 bucket is deliberately private (a public bucket
     * requires payment history on Backblaze's free tier, which the whole
     * point of choosing B2 was to avoid), so showLogo() proxies the file
     * through the app using its own B2 credentials instead.
     */
    public function uploadLogo(UploadSchoolLogoRequest $request): JsonResponse
    {
        $schoolId = $this->schoolResolver->resolve($request->user());
        $school = School::query()->findOrFail($schoolId);
        $disk = config('filesystems.uploads_disk');

        $previousPath = $school->logo_url ? $this->storagePathFromUrl($school->logo_url) : null;

        $path = $request->file('logo')->store("logos/{$schoolId}", $disk);
        $before = ['logo_url' => $school->logo_url];
        $school->update(['logo_url' => route('logos.show', ['schoolId' => $schoolId, 'filename' => basename($path)])]);

        if ($previousPath && Storage::disk($disk)->exists($previousPath)) {
            Storage::disk($disk)->delete($previousPath);
        }

        $this->auditLogger->log('settings.school_profile_updated', 'school', $school->id, $before, ['logo_url' => $school->logo_url], $schoolId);

        return ApiResponse::success($school->fresh(), 'Logo updated successfully.');
    }

    /**
     * Public, unauthenticated proxy for a school's logo (routes.php) —
     * the browser requests this as a plain <img src>, same as the old
     * /storage/logos/... symlinked path did, so it can't carry an auth
     * header. The B2 bucket itself is private; this route is what makes
     * the file viewable at all, fetching it from B2 with the app's own
     * credentials and streaming it back. Long cache lifetime is safe:
     * Laravel's store() names each upload with a fresh random filename
     * (Prompt 8's convention, unchanged here), so a replaced logo is a
     * new URL, never a stale cache of the old one under the same URL.
     */
    public function showLogo(int $schoolId, string $filename): StreamedResponse
    {
        $disk = Storage::disk(config('filesystems.uploads_disk'));
        $path = "logos/{$schoolId}/{$filename}";

        if (! $disk->exists($path)) {
            abort(404);
        }

        return $disk->response($path, $filename, ['Cache-Control' => 'public, max-age=31536000, immutable']);
    }

    private function storagePathFromUrl(string $url): ?string
    {
        $marker = '/logos/';
        $position = strpos($url, $marker);

        return $position === false ? null : 'logos/'.substr($url, $position + strlen($marker));
    }

    public function attendanceConfig(Request $request): JsonResponse
    {
        $schoolId = $this->schoolResolver->resolve($request->user());

        return ApiResponse::success(SchoolConfig::query()->findOrFail($schoolId));
    }

    /**
     * Takes effect immediately for future scans (AttendanceService reads
     * SchoolConfig live on every scan) and never retroactively touches
     * past attendance_records — the frontend surfaces this explicitly as
     * a warning, this isn't just a docblock note.
     */
    public function updateAttendanceConfig(UpdateAttendanceConfigRequest $request): JsonResponse
    {
        $schoolId = $this->schoolResolver->resolve($request->user());
        $config = SchoolConfig::query()->findOrFail($schoolId);
        $before = $config->only(array_keys($request->validated()));
        $config->update($request->validated());

        $this->auditLogger->log('settings.attendance_rules_updated', 'school_config', $schoolId, $before, $request->validated(), $schoolId);

        return ApiResponse::success($config->fresh(), 'Attendance rules updated successfully.');
    }

    /**
     * Read-only — rollover and full academic-year management are
     * deferred to a future phase (Prompt 23 Part D).
     */
    public function academicYear(Request $request): JsonResponse
    {
        $schoolId = $this->schoolResolver->resolve($request->user());

        $academicYear = AcademicYear::query()
            ->where('school_id', $schoolId)
            ->where('is_current', true)
            ->first();

        return ApiResponse::success($academicYear);
    }

    /**
     * Read-only here too — activating/renewing a subscription is a
     * platform-operator action (Platform Console), not something a
     * school's own admin does from their Settings page (Prompt 25 Part
     * C). Status is always computed live from amc_expiry_date, never
     * the stored license_status column.
     */
    public function license(Request $request): JsonResponse
    {
        $schoolId = $this->schoolResolver->resolve($request->user());
        $school = School::query()->findOrFail($schoolId);

        return ApiResponse::success([
            'status' => $school->licenseStatus()->value,
            'amc_expiry_date' => $school->amc_expiry_date?->toDateString(),
            'days_until_expiry' => $school->daysUntilExpiry(),
            'grace_days' => School::GRACE_DAYS,
        ]);
    }
}
