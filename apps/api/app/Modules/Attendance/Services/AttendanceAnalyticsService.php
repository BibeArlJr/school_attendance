<?php

namespace App\Modules\Attendance\Services;

use App\Modules\Attendance\Models\AttendanceRecord;
use App\Modules\Attendance\Models\SchoolCalendar;
use App\Modules\Attendance\Models\SchoolConfig;
use App\Modules\School\Models\AcademicYear;
use App\Modules\Staff\Models\Staff;
use App\Modules\Student\Models\Student;
use App\Support\Enums\AttendanceRecordStatus;
use App\Support\Enums\CalendarDayType;
use App\Support\Enums\StaffEmploymentStatus;
use App\Support\Enums\StudentStatus;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Collection;

/**
 * The single source of truth for "was this a school day" and "who's
 * absent" — used by the dashboard summary, the Attendance list's absent
 * drill-down, and the per-student calendar/summary (Prompt 18). There is
 * no stored "absent" row for a no-show (the scan-driven state machine in
 * AttendanceService never creates one), so absence is always a computed
 * set difference: active owners minus those with a record for the date,
 * on days that are actually working days.
 */
class AttendanceAnalyticsService
{
    public function isWorkingDay(int $schoolId, Carbon $date): bool
    {
        $config = SchoolConfig::query()->findOrFail($schoolId);

        if (! in_array($date->dayOfWeek, $config->working_days, true)) {
            return false;
        }

        $dayType = $this->calendarDayType($schoolId, $date);

        return ! in_array($dayType, [CalendarDayType::Holiday, CalendarDayType::ExamDay], true);
    }

    public function calendarDayType(int $schoolId, Carbon $date): CalendarDayType
    {
        $entry = SchoolCalendar::query()
            ->where('school_id', $schoolId)
            ->whereDate('date', $date->toDateString())
            ->first();

        return $entry?->day_type ?? CalendarDayType::Working;
    }

    /**
     * @return array{is_working_day: bool, present: int, late: int, absent: int, total: int}
     */
    public function dailyCounts(int $schoolId, Carbon $date, string $ownerType = 'student', ?int $classId = null): array
    {
        $isWorkingDay = $this->isWorkingDay($schoolId, $date);
        $activeOwnerCount = $this->activeOwnerCount($schoolId, $ownerType, $classId);

        $baseQuery = fn () => AttendanceRecord::query()
            ->where('school_id', $schoolId)
            ->where('owner_type', $ownerType)
            ->where('date', $date->toDateString())
            ->when(
                $classId !== null && $ownerType === 'student',
                fn ($query) => $query->whereHasMorph('owner', [Student::class], fn ($inner) => $inner->where('class_id', $classId)),
            );

        $presentCount = $baseQuery()->whereNotNull('in_time')->count();
        $lateCount = $baseQuery()->where('status', AttendanceRecordStatus::Late)->count();

        $absentCount = 0;
        if ($isWorkingDay) {
            $recordedOwnerCount = $baseQuery()->distinct('owner_id')->count('owner_id');
            $absentCount = max(0, $activeOwnerCount - $recordedOwnerCount);
        }

        return [
            'is_working_day' => $isWorkingDay,
            'present' => $presentCount,
            'late' => $lateCount,
            'absent' => $absentCount,
            'total' => $activeOwnerCount,
        ];
    }

    /**
     * Owner ids (student or staff) with NO attendance_record for the given
     * date — i.e. the actual "absent" roster, not just a count. Empty when
     * the date isn't a working day (nobody is "absent" on a holiday).
     */
    public function absentOwnerIds(int $schoolId, Carbon $date, string $ownerType = 'student'): Collection
    {
        if (! $this->isWorkingDay($schoolId, $date)) {
            return collect();
        }

        $recordedOwnerIds = AttendanceRecord::query()
            ->where('school_id', $schoolId)
            ->where('owner_type', $ownerType)
            ->where('date', $date->toDateString())
            ->pluck('owner_id');

        $activeOwnerIds = $ownerType === 'student'
            ? Student::query()->where('school_id', $schoolId)->where('status', StudentStatus::Active)->pluck('id')
            : Staff::query()->where('school_id', $schoolId)->where('employment_status', StaffEmploymentStatus::Active)->pluck('id');

        return $activeOwnerIds->diff($recordedOwnerIds)->values();
    }

    public function workingDaysInRange(int $schoolId, Carbon $from, Carbon $to): int
    {
        if ($from->greaterThan($to)) {
            return 0;
        }

        $config = SchoolConfig::query()->findOrFail($schoolId);

        $overrides = SchoolCalendar::query()
            ->where('school_id', $schoolId)
            ->whereBetween('date', [$from->toDateString(), $to->toDateString()])
            ->get()
            ->keyBy(fn (SchoolCalendar $entry) => $entry->date->toDateString());

        $count = 0;
        foreach (CarbonPeriod::create($from, $to) as $date) {
            if (! in_array($date->dayOfWeek, $config->working_days, true)) {
                continue;
            }

            $dayType = $overrides->get($date->toDateString())?->day_type ?? CalendarDayType::Working;
            if (in_array($dayType, [CalendarDayType::Holiday, CalendarDayType::ExamDay], true)) {
                continue;
            }

            $count++;
        }

        return $count;
    }

    /**
     * @return array{from: string, to: string, total_working_days: int, present_days: int, absent_days: int, attendance_percentage: float}
     */
    public function studentSummary(Student $student, ?Carbon $from = null, ?Carbon $to = null): array
    {
        $to ??= Carbon::today();

        if (! $from) {
            $academicYearStart = AcademicYear::query()
                ->where('school_id', $student->school_id)
                ->where('is_current', true)
                ->value('start_date');

            $admissionDate = $student->admission_date->copy()->startOfDay();
            $from = $academicYearStart && Carbon::parse($academicYearStart)->greaterThan($admissionDate)
                ? Carbon::parse($academicYearStart)
                : $admissionDate;
        }

        if ($from->greaterThan($to)) {
            return [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
                'total_working_days' => 0,
                'present_days' => 0,
                'absent_days' => 0,
                'attendance_percentage' => 0.0,
            ];
        }

        $totalWorkingDays = $this->workingDaysInRange($student->school_id, $from, $to);

        $presentDays = AttendanceRecord::query()
            ->where('school_id', $student->school_id)
            ->where('owner_type', 'student')
            ->where('owner_id', $student->id)
            ->whereBetween('date', [$from->toDateString(), $to->toDateString()])
            ->whereNotNull('in_time')
            ->count();

        $absentDays = max(0, $totalWorkingDays - $presentDays);
        $percentage = $totalWorkingDays > 0 ? round($presentDays / $totalWorkingDays * 100, 2) : 0.0;

        return [
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'total_working_days' => $totalWorkingDays,
            'present_days' => $presentDays,
            'absent_days' => $absentDays,
            'attendance_percentage' => $percentage,
        ];
    }

    /**
     * @return list<array{date: string, status: string, day_type: string, label: ?string, in_time: ?string, out_time: ?string}>
     */
    public function studentCalendar(Student $student, int $year, int $month): array
    {
        $from = Carbon::create($year, $month, 1)->startOfDay();
        $to = $from->copy()->endOfMonth();
        $today = Carbon::today();

        $config = SchoolConfig::query()->findOrFail($student->school_id);

        $overrides = SchoolCalendar::query()
            ->where('school_id', $student->school_id)
            ->whereBetween('date', [$from->toDateString(), $to->toDateString()])
            ->get()
            ->keyBy(fn (SchoolCalendar $entry) => $entry->date->toDateString());

        $records = AttendanceRecord::query()
            ->where('school_id', $student->school_id)
            ->where('owner_type', 'student')
            ->where('owner_id', $student->id)
            ->whereBetween('date', [$from->toDateString(), $to->toDateString()])
            ->get()
            ->keyBy(fn (AttendanceRecord $record) => $record->date->toDateString());

        $days = [];
        foreach (CarbonPeriod::create($from, $to) as $date) {
            $dateStr = $date->toDateString();
            $override = $overrides->get($dateStr);
            $calendarDayType = $override?->day_type ?? CalendarDayType::Working;
            $isWeekendOff = ! in_array($date->dayOfWeek, $config->working_days, true);
            $record = $records->get($dateStr);

            if (in_array($calendarDayType, [CalendarDayType::Holiday, CalendarDayType::ExamDay], true)) {
                $status = 'holiday';
            } elseif ($isWeekendOff) {
                $status = 'non_school_day';
            } elseif ($date->greaterThan($today)) {
                $status = 'upcoming';
            } elseif ($record && $record->in_time !== null) {
                $status = $record->status === AttendanceRecordStatus::Late ? 'late' : 'present';
            } else {
                $status = 'absent';
            }

            $days[] = [
                'date' => $dateStr,
                'status' => $status,
                'day_type' => $calendarDayType->value,
                'label' => $override?->label,
                'in_time' => $record?->in_time,
                'out_time' => $record?->out_time,
            ];
        }

        return $days;
    }

    private function activeOwnerCount(int $schoolId, string $ownerType, ?int $classId = null): int
    {
        if ($ownerType === 'student') {
            return Student::query()
                ->where('school_id', $schoolId)
                ->where('status', StudentStatus::Active)
                ->when($classId !== null, fn ($query) => $query->where('class_id', $classId))
                ->count();
        }

        return Staff::query()->where('school_id', $schoolId)->where('employment_status', StaffEmploymentStatus::Active)->count();
    }
}
