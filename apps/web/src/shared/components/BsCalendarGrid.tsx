import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';
import {
  BS_MONTH_NAMES,
  bsMonthStartWeekday,
  daysInBsMonth,
  MAX_BS_YEAR,
  MIN_BS_YEAR,
  todayBs,
  WEEKDAY_NAMES,
} from '@/shared/lib/bikramSambat';
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

/** 'days' is the normal calendar; 'years'/'months' are the fast-nav
 *  views this component switches through — clicking the day-grid's
 *  header enters 'years', picking a year enters 'months' for it,
 *  picking a month returns to 'days' on that month (fast-year/month-nav
 *  prompt). Local, not lifted to the parent picker: it's pure UI-flow
 *  state, unrelated to which date is actually selected/viewed, and
 *  naturally resets to 'days' every time this unmounts (Radix Popover
 *  unmounts its content on close by default, no forceMount here) — so a
 *  picker reopened later never strands the user mid-navigation.
 */
type ViewMode = 'days' | 'months' | 'years';

/**
 * The month/year-nav header + day grid shared by BsDatePicker and
 * BsDateRangePicker (Prompt 27) — this is the one place month-length/
 * weekday-start/today logic lives, so both pickers stay in sync and
 * neither reimplements calendar math.
 */
export function BsCalendarGrid({ year, month, onNavigate, onSelectDay, dayClassName }: BsCalendarGridProps) {
  const [mode, setMode] = useState<ViewMode>('days');

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

  function selectYear(selectedYear: number) {
    onNavigate(selectedYear, month);
    setMode('months');
  }

  function selectMonth(selectedMonth: number) {
    onNavigate(year, selectedMonth);
    setMode('days');
  }

  if (mode === 'years') {
    return <BsYearGrid currentYear={year} onSelect={selectYear} />;
  }

  if (mode === 'months') {
    return <BsMonthGrid year={year} currentMonth={month} onSelect={selectMonth} onBack={() => setMode('years')} />;
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
        <button
          type="button"
          onClick={() => setMode('years')}
          className="rounded-md px-2 py-1 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
        >
          {BS_MONTH_NAMES[month - 1]} {year}
        </button>
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

/** Full MIN_BS_YEAR..MAX_BS_YEAR range in one scrollable grid, rather
 *  than a ±100 window around today — bikram-sambat-js's own hard bounds
 *  are already narrower than ±100 would be on the high end (see
 *  MAX_BS_YEAR's docblock), so clamping to them directly is simpler
 *  than computing a window and clamping it anyway. */
function BsYearGrid({ currentYear, onSelect }: { currentYear: number; onSelect: (year: number) => void }) {
  const today = todayBs();
  const years = Array.from({ length: MAX_BS_YEAR - MIN_BS_YEAR + 1 }, (_, i) => MIN_BS_YEAR + i);

  return (
    <div>
      <p className="mb-2 px-1 text-sm font-medium">Select year</p>
      <div className="grid max-h-64 grid-cols-4 gap-1 overflow-y-auto">
        {years.map((y) => {
          const isSelected = y === currentYear;
          const isThisYear = y === today.year;

          return (
            <button
              key={y}
              type="button"
              onClick={() => onSelect(y)}
              className={cn(
                'rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground',
                isSelected && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
                !isSelected && isThisYear && 'font-semibold text-primary',
              )}
            >
              {y}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BsMonthGrid({
  year,
  currentMonth,
  onSelect,
  onBack,
}: {
  year: number;
  currentMonth: number;
  onSelect: (month: number) => void;
  onBack: () => void;
}) {
  const today = todayBs();

  return (
    <div>
      <div className="mb-2 flex items-center justify-center gap-1">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md px-2 py-1 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
        >
          {year}
        </button>
      </div>
      <div className="grid grid-cols-3 gap-1">
        {BS_MONTH_NAMES.map((name, index) => {
          const monthNumber = index + 1;
          const isSelected = monthNumber === currentMonth;
          const isThisMonth = monthNumber === today.month && year === today.year;

          return (
            <button
              key={name}
              type="button"
              onClick={() => onSelect(monthNumber)}
              className={cn(
                'rounded-md px-2 py-2 text-sm hover:bg-accent hover:text-accent-foreground',
                isSelected && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
                !isSelected && isThisMonth && 'font-semibold text-primary',
              )}
            >
              {name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
