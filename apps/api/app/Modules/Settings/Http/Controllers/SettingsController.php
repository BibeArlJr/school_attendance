<?php

namespace App\Modules\Settings\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Attendance\Models\SchoolConfig;
use App\Modules\School\Models\AcademicYear;
use App\Modules\School\Models\School;
use App\Modules\Settings\Http\Requests\UpdateAttendanceConfigRequest;
use App\Modules\Settings\Http\Requests\UpdateSchoolProfileRequest;
use App\Support\Responses\ApiResponse;
use App\Support\Services\CurrentSchoolResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function __construct(private readonly CurrentSchoolResolver $schoolResolver)
    {
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
        $school->update($request->validated());

        return ApiResponse::success($school->fresh(), 'School profile updated successfully.');
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
        $config->update($request->validated());

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
