import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useStudentAttendanceSummary } from '../hooks/useStudentAttendanceSummary';
import { useStudentCalendar } from '../hooks/useStudentCalendar';
import type { AttendanceCalendarDay, AttendanceCalendarDayStatus } from '../types';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { LoadingSkeleton } from '@/shared/components/feedback/LoadingSkeleton';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip';
import { cn } from '@/shared/lib/utils';

interface AttendanceHistorySectionProps {
  studentUuid: string;
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const STATUS_STYLES: Record<AttendanceCalendarDayStatus, string> = {
  present: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300',
  late: 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-300',
  absent: 'bg-destructive/10 text-destructive',
  holiday: 'bg-blue-100 text-blue-900 dark:bg-blue-950/50 dark:text-blue-300',
  non_school_day: 'bg-muted text-muted-foreground',
  upcoming: 'text-muted-foreground/50',
};

const STATUS_LABELS: Record<AttendanceCalendarDayStatus, string> = {
  present: 'Present',
  late: 'Late',
  absent: 'Absent',
  holiday: 'Holiday',
  non_school_day: 'Non-school day',
  upcoming: 'Upcoming',
};

function formatTime(time: string | null): string | null {
  if (!time) return null;
  const [hoursStr, minutesStr] = time.split(':');
  const hours = Number(hoursStr);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHours}:${minutesStr} ${period}`;
}

function dayTooltip(day: AttendanceCalendarDay): string {
  const parts = [STATUS_LABELS[day.status]];
  if (day.label) parts.push(day.label);
  const inTime = formatTime(day.in_time);
  const outTime = formatTime(day.out_time);
  if (inTime) parts.push(`In: ${inTime}`);
  if (outTime) parts.push(`Out: ${outTime}`);
  return parts.join(' — ');
}

export function AttendanceHistorySection({ studentUuid }: AttendanceHistorySectionProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  const calendarQuery = useStudentCalendar(studentUuid, year, month);
  const summaryQuery = useStudentAttendanceSummary(studentUuid);

  function goToPreviousMonth() {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function goToNextMonth() {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  const days = calendarQuery.data ?? [];
  const leadingBlanks = days.length > 0 ? new Date(year, month - 1, 1).getDay() : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance History</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {summaryQuery.data && (
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-md border p-3">
              <p className="text-2xl font-semibold tracking-tight">
                {summaryQuery.data.present_days}
              </p>
              <p className="text-xs text-muted-foreground">Present days</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-2xl font-semibold tracking-tight">
                {summaryQuery.data.absent_days}
              </p>
              <p className="text-xs text-muted-foreground">Absent days</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-2xl font-semibold tracking-tight">
                {summaryQuery.data.attendance_percentage}%
              </p>
              <p className="text-xs text-muted-foreground">Attendance</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <Button variant="outline" size="icon-sm" onClick={goToPreviousMonth} aria-label="Previous month">
            <ChevronLeft className="size-4" />
          </Button>
          <p className="text-sm font-medium">
            {MONTH_LABELS[month - 1]} {year}
          </p>
          <Button variant="outline" size="icon-sm" onClick={goToNextMonth} aria-label="Next month">
            <ChevronRight className="size-4" />
          </Button>
        </div>

        {calendarQuery.isLoading ? (
          <LoadingSkeleton lines={4} />
        ) : days.length === 0 ? (
          <EmptyState title="No calendar data for this month" />
        ) : (
          <TooltipProvider>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
              {WEEKDAY_LABELS.map((label) => (
                <div key={label} className="py-1">
                  {label}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: leadingBlanks }).map((_, index) => (
                <div key={`blank-${index}`} />
              ))}
              {days.map((day) => (
                <Tooltip key={day.date}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        'flex aspect-square items-center justify-center rounded-md text-sm',
                        STATUS_STYLES[day.status],
                      )}
                    >
                      {Number(day.date.slice(-2))}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>{dayTooltip(day)}</TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
        )}
      </CardContent>
    </Card>
  );
}
