import { CalendarDays, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import {
  adToBs,
  BS_MONTH_NAMES,
  bsMonthStartWeekday,
  bsToAd,
  daysInBsMonth,
  todayBs,
  WEEKDAY_NAMES,
  type BsDate,
} from '@/shared/lib/bikramSambat';
import { cn } from '@/shared/lib/utils';

interface BsDatePickerProps {
  /** Stored/emitted value is always a Gregorian (AD) date string,
   *  YYYY-MM-DD — only the picker UI itself works in BS (Prompt 27 Part
   *  B). Empty string means "no date selected", matching this app's
   *  existing plain `<Input type="date">` convention. */
  value: string;
  onChange: (adDate: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * A school-calendar-scoped BS (Bikram Sambat) date picker — deliberately
 * not a generic app-wide date input (Prompt 27 explicitly scopes BS
 * picking to the School Calendar feature only; academic year/DOB/Reports
 * dates stay AD `<Input type="date">` for now). Built on bikram-sambat-js
 * (pure conversion, MIT, zero deps) rather than a pre-built React
 * date-picker package, since every actively-maintained option pins a
 * `react: ^18` peer dependency that conflicts with this app's React 19 —
 * this component reuses the app's own Popover/Button primitives instead,
 * so it matches the design system for free and has no peer-dep risk.
 */
export function BsDatePicker({ value, onChange, placeholder, disabled }: BsDatePickerProps) {
  const [open, setOpen] = useState(false);
  const selectedBs = value ? adToBs(value) : null;
  const [view, setView] = useState<{ year: number; month: number }>(() => selectedBs ?? todayBs());

  function openChange(next: boolean) {
    if (next) {
      // Re-anchor the visible month to the current value each time it
      // opens, so re-opening after picking a date doesn't strand the
      // user on whatever month they last scrolled to.
      setView(selectedBs ?? todayBs());
    }
    setOpen(next);
  }

  function shiftMonth(delta: number) {
    setView((current) => {
      let month = current.month + delta;
      let year = current.year;
      if (month > 12) {
        month = 1;
        year += 1;
      } else if (month < 1) {
        month = 12;
        year -= 1;
      }
      return { year, month };
    });
  }

  function shiftYear(delta: number) {
    setView((current) => ({ ...current, year: current.year + delta }));
  }

  function selectDay(day: number) {
    const bsDate: BsDate = { year: view.year, month: view.month, day };
    onChange(bsToAd(bsDate));
    setOpen(false);
  }

  const startWeekday = bsMonthStartWeekday(view.year, view.month);
  const totalDays = daysInBsMonth(view.year, view.month);
  const cells: (number | null)[] = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  const today = todayBs();

  const displayText = selectedBs
    ? `${BS_MONTH_NAMES[selectedBs.month - 1]} ${selectedBs.day}, ${selectedBs.year} BS`
    : (placeholder ?? 'Pick a date (BS)');

  return (
    <div className="space-y-1">
      <Popover open={open} onOpenChange={openChange}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn('w-full justify-start font-normal', !selectedBs && 'text-muted-foreground')}
          >
            <CalendarDays className="size-4" />
            {displayText}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72">
          <div className="mb-2 flex items-center justify-between gap-1">
            <div className="flex items-center">
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => shiftYear(-1)} aria-label="Previous year">
                <ChevronsLeft className="size-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => shiftMonth(-1)} aria-label="Previous month">
                <ChevronLeft className="size-4" />
              </Button>
            </div>
            <span className="text-sm font-medium">
              {BS_MONTH_NAMES[view.month - 1]} {view.year}
            </span>
            <div className="flex items-center">
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => shiftMonth(1)} aria-label="Next month">
                <ChevronRight className="size-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => shiftYear(1)} aria-label="Next year">
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
              const isSelected =
                selectedBs?.year === view.year && selectedBs.month === view.month && selectedBs.day === day;
              const isToday = today.year === view.year && today.month === view.month && today.day === day;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => selectDay(day)}
                  className={cn(
                    'flex size-8 items-center justify-center rounded-md text-sm hover:bg-accent hover:text-accent-foreground',
                    isSelected && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
                    !isSelected && isToday && 'font-semibold text-primary',
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
      {value && <p className="text-xs text-muted-foreground">{value} AD</p>}
    </div>
  );
}
