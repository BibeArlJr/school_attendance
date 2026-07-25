import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
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
import {
  BS_MONTH_NAMES,
  bsMonthStartWeekday,
  daysInBsMonth,
  toAd,
  todayBs,
  WEEKDAY_NAMES,
} from '@/shared/lib/bikramSambat';
import { cn } from '@/shared/lib/utils';

interface AttendanceHistorySectionProps {
  studentUuid: string;
}

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

/**
 * Renders a BS (Bikram Sambat) month grid, not an AD one (Prompt 18's
 * original AD grid, converted in Prompt 28 Part B) — BS months don't
 * align with AD month boundaries or share fixed day-counts, so each BS
 * calendar day here is individually mapped to its underlying AD date
 * (via the shared toAd utility) to look up that day's attendance record.
 * Color-coding/hover-tooltip behavior is untouched from Phase 18 — only
 * the grid's date system changed.
 */
export function AttendanceHistorySection({ studentUuid }: AttendanceHistorySectionProps) {
  const [view, setView] = useState<{ year: number; month: number }>(() => {
    const today = todayBs();
    return { year: today.year, month: today.month };
  });

  const totalDays = daysInBsMonth(view.year, view.month);
  const from = toAd({ year: view.year, month: view.month, day: 1 });
  const to = toAd({ year: view.year, month: view.month, day: totalDays });

  const calendarQuery = useStudentCalendar(studentUuid, from, to);
  const summaryQuery = useStudentAttendanceSummary(studentUuid);

  function goToPreviousMonth() {
    setView((current) =>
      current.month === 1
        ? { year: current.year - 1, month: 12 }
        : { year: current.year, month: current.month - 1 },
    );
  }

  function goToNextMonth() {
    setView((current) =>
      current.month === 12
        ? { year: current.year + 1, month: 1 }
        : { year: current.year, month: current.month + 1 },
    );
  }

  const daysByAdDate = useMemo(() => {
    const map = new Map<string, AttendanceCalendarDay>();
    for (const day of calendarQuery.data ?? []) {
      map.set(day.date.slice(0, 10), day);
    }
    return map;
  }, [calendarQuery.data]);

  // Every BS day in [1, totalDays] maps 1:1 onto a consecutive AD date
  // within [from, to] — the backend range is computed to cover exactly
  // that span, so this lookup always finds a match.
  const bsDays = Array.from({ length: totalDays }, (_, i) => {
    const day = i + 1;
    const adDate = toAd({ year: view.year, month: view.month, day });
    return { day, adDate, record: daysByAdDate.get(adDate) };
  });

  const leadingBlanks = bsMonthStartWeekday(view.year, view.month);
  const hasData = calendarQuery.data && calendarQuery.data.length > 0;

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
            {BS_MONTH_NAMES[view.month - 1]} {view.year} BS
          </p>
          <Button variant="outline" size="icon-sm" onClick={goToNextMonth} aria-label="Next month">
            <ChevronRight className="size-4" />
          </Button>
        </div>

        {calendarQuery.isLoading ? (
          <LoadingSkeleton lines={4} />
        ) : !hasData ? (
          <EmptyState title="No calendar data for this month" />
        ) : (
          <TooltipProvider>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
              {WEEKDAY_NAMES.map((label) => (
                <div key={label} className="py-1">
                  {label}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: leadingBlanks }).map((_, index) => (
                <div key={`blank-${index}`} />
              ))}
              {bsDays.map(({ day, adDate, record }) =>
                record ? (
                  <Tooltip key={adDate}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          'flex aspect-square items-center justify-center rounded-md text-sm',
                          STATUS_STYLES[record.status],
                        )}
                      >
                        {day}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>{dayTooltip(record)}</TooltipContent>
                  </Tooltip>
                ) : (
                  <div
                    key={adDate}
                    className="flex aspect-square items-center justify-center rounded-md text-sm text-muted-foreground/50"
                  >
                    {day}
                  </div>
                ),
              )}
            </div>
          </TooltipProvider>
        )}
      </CardContent>
    </Card>
  );
}
