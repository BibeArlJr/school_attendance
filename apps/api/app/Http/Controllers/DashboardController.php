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

    public function attendanceTrend(): JsonResponse
    {
        // TODO(Phase 12): replace with real aggregation query.
        // Hardcoded demo shape only — no students exist in this phase, so
        // this can't be derived from real data yet. Saturday is forced to
        // 0/0 since Nepali schools run Sunday-Friday and are closed Saturday.
        $today = now()->startOfDay();
        $presentByWeekday = [96, 118, 112, 104, 90, 101, 0]; // Sun..Sat

        $trend = collect(range(6, 0))->map(function (int $daysAgo) use ($today, $presentByWeekday) {
            $date = $today->copy()->subDays($daysAgo);
            $isSaturday = $date->dayOfWeek === 6;

            return [
                'date' => $date->toDateString(),
                'presentCount' => $isSaturday ? 0 : $presentByWeekday[$date->dayOfWeek],
                'totalCount' => $isSaturday ? 0 : 120,
            ];
        })->values()->all();

        return ApiResponse::success($trend);
    }
}
