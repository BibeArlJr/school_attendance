<?php

namespace App\Modules\Reports\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Attendance\Services\AttendanceAnalyticsService;
use App\Modules\School\Models\SchoolClass;
use App\Modules\Student\Models\Student;
use App\Support\Enums\StudentStatus;
use App\Support\Responses\ApiResponse;
use App\Support\Services\CurrentSchoolResolver;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function __construct(
        private readonly CurrentSchoolResolver $schoolResolver,
        private readonly AttendanceAnalyticsService $analytics,
    ) {
    }

    /**
     * One row per day in the range, reusing AttendanceAnalyticsService's
     * dailyCounts()/calendarDayType() exactly — no parallel present/absent
     * calculation here (Prompt 21's architecture constraint). Defaults to
     * the last 7 days, matching the real attendance history currently
     * being only 1 day deep — most of that default range is expected to
     * come back empty, not broken.
     */
    public function attendanceSummary(Request $request): JsonResponse
    {
        $schoolId = $this->schoolResolver->resolve($request->user());

        $to = $request->query('to') ? Carbon::parse($request->query('to')) : Carbon::today();
        $from = $request->query('from') ? Carbon::parse($request->query('from')) : $to->copy()->subDays(6);
        $classId = $request->query('class_id') ? (int) $request->query('class_id') : null;

        $rows = [];
        foreach (CarbonPeriod::create($from, $to) as $date) {
            $counts = $this->analytics->dailyCounts($schoolId, $date, 'student', $classId);

            $rows[] = [
                'date' => $date->toDateString(),
                'present' => $counts['present'],
                'absent' => $counts['absent'],
                'late' => $counts['late'],
                'total' => $counts['total'],
                // day_type is the calendar override alone (defaults to
                // "working" when none exists) — it does NOT know about
                // weekly working_days, so a plain Saturday also reports
                // "working" here. is_working_day is the real combined
                // signal (weekday-in-working_days AND not a calendar
                // holiday/exam day) — the frontend needs both to label a
                // weekend correctly instead of implying it's a school day
                // with zero attendance.
                'day_type' => $this->analytics->calendarDayType($schoolId, $date)->value,
                'is_working_day' => $counts['is_working_day'],
            ];
        }

        return ApiResponse::success($rows);
    }

    /**
     * Students per class (same withCount pattern ClassController uses for
     * its live "Students" column, Prompt 17), a status breakdown, and a
     * data-quality section — real gaps in the actual imported dataset
     * (missing gender/dob/guardian), not decorative filler. class_id
     * narrows the status breakdown + data quality numbers to one class;
     * the per-class list itself always shows every class, since that's
     * the whole point of a distribution view.
     */
    public function enrollmentSummary(Request $request): JsonResponse
    {
        $schoolId = $this->schoolResolver->resolve($request->user());
        $classId = $request->query('class_id') ? (int) $request->query('class_id') : null;

        $classes = SchoolClass::query()
            ->where('school_id', $schoolId)
            // select() must come before withCount() — withCount()'s
            // addSelect() pre-populates query->columns, so passing columns
            // to get() afterward is silently ignored otherwise.
            ->select(['id', 'uuid', 'name', 'section'])
            ->withCount(['students as active_students_count' => fn ($query) => $query->where('status', StudentStatus::Active)])
            ->orderBy('grade_level')
            ->orderBy('name')
            ->orderBy('section')
            ->get();

        $scopedStudents = fn () => Student::query()
            ->where('school_id', $schoolId)
            ->when($classId !== null, fn ($query) => $query->where('class_id', $classId));

        $statusBreakdown = [];
        foreach (StudentStatus::cases() as $status) {
            $statusBreakdown[$status->value] = (clone $scopedStudents())->where('status', $status)->count();
        }

        $totalStudents = array_sum($statusBreakdown);
        $missingGender = $scopedStudents()->whereNull('gender')->count();
        $missingDob = $scopedStudents()->whereNull('dob')->count();
        $noGuardian = $scopedStudents()->whereDoesntHave('parentLinks')->count();

        return ApiResponse::success([
            'classes' => $classes,
            'status_breakdown' => $statusBreakdown,
            'data_quality' => [
                'total_students' => $totalStudents,
                'missing_gender' => $this->countAndPercentage($missingGender, $totalStudents),
                'missing_dob' => $this->countAndPercentage($missingDob, $totalStudents),
                'no_guardian' => $this->countAndPercentage($noGuardian, $totalStudents),
            ],
        ]);
    }

    /**
     * @return array{count: int, percentage: float}
     */
    private function countAndPercentage(int $count, int $total): array
    {
        return [
            'count' => $count,
            'percentage' => $total > 0 ? round($count / $total * 100, 1) : 0.0,
        ];
    }
}
