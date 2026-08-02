<?php

namespace App\Http\Controllers;

use App\Modules\Attendance\Services\AttendanceAnalyticsService;
use App\Modules\Sms\Models\SmsLog;
use App\Modules\Staff\Models\Staff;
use App\Modules\Student\Models\Student;
use App\Support\Enums\SmsLogStatus;
use App\Support\Enums\StaffEmploymentStatus;
use App\Support\Enums\StudentStatus;
use App\Support\Responses\ApiResponse;
use App\Support\Services\CurrentSchoolResolver;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(
        private readonly CurrentSchoolResolver $schoolResolver,
        private readonly AttendanceAnalyticsService $analytics,
    ) {
    }

    public function summary(Request $request): JsonResponse
    {
        $schoolId = $this->schoolResolver->resolve($request->user());
        $today = Carbon::today();

        $counts = $this->analytics->dailyCounts($schoolId, $today, 'student');

        return ApiResponse::success([
            'total_students' => Student::query()->where('school_id', $schoolId)->where('status', StudentStatus::Active)->count(),
            'total_teachers' => Staff::query()->where('school_id', $schoolId)->where('employment_status', StaffEmploymentStatus::Active)->count(),
            'present_today' => $counts['present'],
            'absent_today' => $counts['absent'],
            'late_today' => $counts['late'],
            'is_working_day' => $counts['is_working_day'],
            'sms_sent_today' => SmsLog::query()
                ->where('school_id', $schoolId)
                ->where('status', SmsLogStatus::Sent)
                ->whereDate('sent_at', $today)
                ->count(),
        ]);
    }

    /**
     * Real per-day counts via AttendanceAnalyticsService::dailyCounts()
     * (Prompt 55 audit) — this previously returned hardcoded demo
     * numbers (a Phase 12 TODO that outlived every phase since,
     * unnoticed because it looked plausible on the dashboard). 0/0 on a
     * non-working day generalizes the old "Saturday forced to 0"
     * special case to any real holiday/exam day via
     * SchoolCalendar, not just the weekday assumption.
     */
    public function attendanceTrend(Request $request): JsonResponse
    {
        $schoolId = $this->schoolResolver->resolve($request->user());
        $today = Carbon::today();

        $trend = collect(range(6, 0))->map(function (int $daysAgo) use ($schoolId, $today) {
            $date = $today->copy()->subDays($daysAgo);
            $counts = $this->analytics->dailyCounts($schoolId, $date, 'student');

            return [
                'date' => $date->toDateString(),
                'presentCount' => $counts['is_working_day'] ? $counts['present'] : 0,
                'totalCount' => $counts['is_working_day'] ? $counts['total'] : 0,
            ];
        })->values()->all();

        return ApiResponse::success($trend);
    }
}
