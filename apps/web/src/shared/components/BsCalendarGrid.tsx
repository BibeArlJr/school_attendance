import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from './ui/button';
import { BS_MONTH_NAMES, bsMonthStartWeekday, daysInBsMonth, todayBs, WEEKDAY_NAMES } from '@/shared/lib/bikramSambat';
import { cn } from '@/shared/lib/utils';

interface BsCalendarGridProps {
  year: number;
  month: number;
  onNavigate: (year: number, month: number) => void;
  onSelectDay: (day: number) => void;
  /** Extra classes for a given day cell (selection/range highlighting) —
   *  kept fully agnostic of selection semantics here so this one grid
   *  serves both BsDatePicker (single selection) and BsDateRangePicker
   *  (range highlighting) without knowing which. */
  dayClassName?: (day: number) => string | undefined;
}

/**
 * The month/year-nav header + day grid shared by BsDatePicker and
 * BsDateRangePicker (Prompt 27) — this is the one place month-length/
 * weekday-start/today logic lives, so both pickers stay in sync and
 * neither reimplements calendar math.
 */
export function BsCalendarGrid({ year, month, onNavigate, onSelectDay, dayClassName }: BsCalendarGridProps) {
  function shiftMonth(delta: number) {
    let nextMonth = month + delta;
    let nextYear = year;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    } else if (nextMonth < 1) {
      nextMonth = 12;
      nextYear -= 1;
    }
    onNavigate(nextYear, nextMonth);
  }

  const startWeekday = bsMonthStartWeekday(year, month);
  const totalDays = daysInBsMonth(year, month);
  const cells: (number | null)[] = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  const today = todayBs();

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-1">
        <div className="flex items-center">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onNavigate(year - 1, month)}
            aria-label="Previous year"
          >
            <ChevronsLeft className="size-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => shiftMonth(-1)} aria-label="Previous month">
            <ChevronLeft className="size-4" />
          </Button>
        </div>
        <span className="text-sm font-medium">
          {BS_MONTH_NAMES[month - 1]} {year}
        </span>
        <div className="flex items-center">
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => shiftMonth(1)} aria-label="Next month">
            <ChevronRight className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onNavigate(year + 1, month)}
            aria-label="Next year"
          >
            <ChevronsRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {WEEKDAY_NAMES.map((day) => (
          <span key={day} className="py-1">
            {day}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, index) => {
          if (day === null) {
            return <span key={`blank-${index}`} />;
          }
          const isToday = today.year === year && today.month === month && today.day === day;
          const extraClass = dayClassName?.(day);

          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelectDay(day)}
              className={cn(
                'flex size-8 items-center justify-center rounded-md text-sm hover:bg-accent hover:text-accent-foreground',
                !extraClass && isToday && 'font-semibold text-primary',
                extraClass,
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
