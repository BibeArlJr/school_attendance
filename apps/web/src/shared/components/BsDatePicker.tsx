import { CalendarDays } from 'lucide-react';
import { useState } from 'react';
import { BsCalendarGrid } from './BsCalendarGrid';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { formatBs, toAd, toBs, todayBs, type BsDate } from '@/shared/lib/bikramSambat';
import { cn } from '@/shared/lib/utils';

interface BsDatePickerProps {
  /** Stored/emitted value is always a Gregorian (AD) date string,
   *  YYYY-MM-DD — only the picker UI itself works in BS. Empty string
   *  means "no date selected", matching this app's existing plain
   *  `<Input type="date">` convention. Generic value/onChange, with no
   *  School-Calendar (or any other feature) specific logic — this is
   *  shared infrastructure (Prompt 27) meant for every BS date input in
   *  the system. */
  value: string;
  onChange: (adDate: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Suppresses the "{value} AD" hint line below the trigger button.
   *  That line is genuinely useful inside a vertical form field, but it
   *  makes this component's rendered block taller than a plain Input/
   *  Select/Button (all a fixed single-line h-8) — which breaks
   *  alignment when this is used inline in a horizontal filter row next
   *  to those (e.g. the Attendance page's date filter). Default false
   *  (hint shown) so every existing form usage is unaffected; filter-row
   *  call sites opt in. */
  hideAdHint?: boolean;
}

/**
 * The shared single-date BS (Bikram Sambat) picker — every BS date input
 * in the app uses this, not a page-specific implementation (Prompt 27).
 * Built on bikram-sambat-js (see shared/lib/bikramSambat.ts for the full
 * rationale) plus this app's own Popover/Button primitives, so it
 * matches the design system for free and has no peer-dep risk.
 */
export function BsDatePicker({
  value,
  onChange,
  placeholder,
  disabled,
  hideAdHint = false,
}: BsDatePickerProps) {
  const [open, setOpen] = useState(false);
  const selectedBs = value ? toBs(value) : null;
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

  function selectDay(day: number) {
    const bsDate: BsDate = { year: view.year, month: view.month, day };
    onChange(toAd(bsDate));
    setOpen(false);
  }

  const displayText = value ? formatBs(value) : (placeholder ?? 'Pick a date (BS)');

  return (
    <div className={hideAdHint ? undefined : 'space-y-1'}>
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
          <BsCalendarGrid
            year={view.year}
            month={view.month}
            onNavigate={(year, month) => setView({ year, month })}
            onSelectDay={selectDay}
            dayClassName={(day) => {
              const isSelected =
                selectedBs?.year === view.year && selectedBs.month === view.month && selectedBs.day === day;
              return isSelected ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground' : undefined;
            }}
          />
        </PopoverContent>
      </Popover>
      {!hideAdHint && value && <p className="text-xs text-muted-foreground">{value} AD</p>}
    </div>
  );
}
