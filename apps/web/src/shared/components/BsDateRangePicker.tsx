import { CalendarDays } from 'lucide-react';
import { useState } from 'react';
import { BsCalendarGrid } from './BsCalendarGrid';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { formatBs, toAd, toBs, todayBs } from '@/shared/lib/bikramSambat';
import { cn } from '@/shared/lib/utils';

interface BsDateRangePickerProps {
  /** Both ends are plain Gregorian (AD) date strings, YYYY-MM-DD, same
   *  convention as BsDatePicker — empty string means unset. Generic
   *  value/onChange with no feature-specific logic baked in (Prompt 27)
   *  — School Calendar's range-holiday mode is just the first consumer,
   *  not the only one this is built for. */
  startValue: string;
  endValue: string;
  onChange: (start: string, end: string) => void;
  disabled?: boolean;
}

/**
 * The shared BS date-RANGE picker (Prompt 27) — one calendar grid, click
 * a start day then an end day. Clicking before the current start (or
 * clicking again once a full range is already picked) restarts the
 * range rather than erroring, which is the least-surprising behavior
 * for a two-click range control.
 *
 * AD date strings (YYYY-MM-DD) sort correctly with plain string
 * comparison, so range membership/ordering below is decided by comparing
 * the AD strings directly rather than converting to Date objects or
 * writing a separate BS comparator.
 */
export function BsDateRangePicker({ startValue, endValue, onChange, disabled }: BsDateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<{ year: number; month: number }>(() =>
    startValue ? toBs(startValue) : todayBs(),
  );

  function openChange(next: boolean) {
    if (next) {
      setView(startValue ? toBs(startValue) : todayBs());
    }
    setOpen(next);
  }

  function selectDay(day: number) {
    const clickedAd = toAd({ year: view.year, month: view.month, day });

    const haveCompleteRange = Boolean(startValue) && Boolean(endValue);
    if (!startValue || haveCompleteRange) {
      // No range yet, or a full range already picked — start a new one.
      onChange(clickedAd, '');
      return;
    }

    // Have a start, picking the end.
    if (clickedAd < startValue) {
      // Clicked before the current start — restart the range here instead
      // of erroring; least-surprising behavior for a two-click control.
      onChange(clickedAd, '');
      return;
    }

    onChange(startValue, clickedAd);
    setOpen(false);
  }

  const displayText = startValue
    ? endValue
      ? `${formatBs(startValue)} → ${formatBs(endValue)}`
      : `${formatBs(startValue)} → pick end date`
    : 'Pick a date range (BS)';

  return (
    <div className="space-y-1">
      <Popover open={open} onOpenChange={openChange}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn('w-full justify-start font-normal', !startValue && 'text-muted-foreground')}
          >
            <CalendarDays className="size-4" />
            <span className="truncate">{displayText}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72">
          <BsCalendarGrid
            year={view.year}
            month={view.month}
            onNavigate={(year, month) => setView({ year, month })}
            onSelectDay={selectDay}
            dayClassName={(day) => {
              const dayAd = toAd({ year: view.year, month: view.month, day });
              const isStart = dayAd === startValue;
              const isEnd = dayAd === endValue;
              const isBetween = Boolean(startValue) && Boolean(endValue) && dayAd > startValue && dayAd < endValue;

              if (isStart || isEnd) {
                return 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground';
              }
              if (isBetween) {
                return 'bg-primary/15 hover:bg-primary/25';
              }
              return undefined;
            }}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            {!startValue
              ? 'Pick the start date.'
              : !endValue
                ? 'Now pick the end date.'
                : `${startValue} → ${endValue} AD`}
          </p>
        </PopoverContent>
      </Popover>
    </div>
  );
}
