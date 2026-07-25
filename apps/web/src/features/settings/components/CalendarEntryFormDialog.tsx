import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm, type Control, type Path } from 'react-hook-form';
import {
  useCreateCalendarEntry,
  useCreateCalendarRange,
  useUpdateCalendarEntry,
} from '../hooks/useCalendarMutations';
import {
  calendarEntrySchema,
  calendarRangeSchema,
  type CalendarEntryFormValues,
  type CalendarRangeFormValues,
} from '../schema';
import type { SchoolCalendarEntry } from '../types';
import { BsDatePicker } from '@/shared/components/BsDatePicker';
import { BsDateRangePicker } from '@/shared/components/BsDateRangePicker';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { extractErrorMessage } from '@/shared/lib/errors';
import { cn } from '@/shared/lib/utils';

interface CalendarEntryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: SchoolCalendarEntry | null;
}

const DAY_TYPE_OPTIONS = [
  { value: 'holiday', label: 'Holiday' },
  { value: 'half_day', label: 'Half day' },
  { value: 'exam_day', label: 'Exam day' },
  { value: 'working', label: 'Working (override)' },
];

function defaultsForEntry(entry?: SchoolCalendarEntry | null): CalendarEntryFormValues {
  return {
    date: entry?.date.slice(0, 10) ?? '',
    day_type: entry?.day_type ?? 'holiday',
    label: entry?.label ?? '',
    half_day_end_time: entry?.half_day_end_time?.slice(0, 5) ?? '',
  };
}

const RANGE_DEFAULTS: CalendarRangeFormValues = {
  start_date: '',
  end_date: '',
  day_type: 'holiday',
  label: '',
  half_day_end_time: '',
};

/**
 * Single-date create/edit form — unchanged behavior from Phase 23, just
 * with the plain `<Input type="date">` swapped for the BS calendar
 * picker (Prompt 27 Part B). The picker still emits/receives a plain AD
 * date string, so the payload shape and validation are untouched.
 */
function SingleEntryForm({
  entry,
  onDone,
}: {
  entry?: SchoolCalendarEntry | null;
  onDone: () => void;
}) {
  const isEdit = Boolean(entry);
  const createEntry = useCreateCalendarEntry();
  const updateEntry = useUpdateCalendarEntry();
  const mutation = isEdit ? updateEntry : createEntry;

  const form = useForm<CalendarEntryFormValues>({
    resolver: zodResolver(calendarEntrySchema),
    defaultValues: defaultsForEntry(entry),
  });

  useEffect(() => {
    form.reset(defaultsForEntry(entry));
    createEntry.reset();
    updateEntry.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry]);

  function onSubmit(values: CalendarEntryFormValues) {
    const payload = {
      date: values.date,
      day_type: values.day_type,
      label: values.label || null,
      half_day_end_time: values.day_type === 'half_day' ? values.half_day_end_time || null : null,
    };

    const promise = isEdit
      ? updateEntry.mutateAsync({ id: entry!.id, values: payload })
      : createEntry.mutateAsync(payload);

    void promise.then(onDone);
  }

  const dayType = form.watch('day_type');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <FormControl>
                <BsDatePicker value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DayTypeAndLabelFields control={form.control} dayType={dayType} />

        {mutation.isError && (
          <p className="text-sm text-destructive">{extractErrorMessage(mutation.error)}</p>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Add entry'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

/**
 * Range create form (Prompt 27 Part A) — creates one school_calendars
 * row per date in [start_date, end_date] in a single action. Create-only
 * (editing a range doesn't make sense — each resulting row is edited
 * individually afterward via the single-entry form, same as any other
 * calendar entry).
 */
function RangeEntryForm({ onDone }: { onDone: () => void }) {
  const createRange = useCreateCalendarRange();

  const form = useForm<CalendarRangeFormValues>({
    resolver: zodResolver(calendarRangeSchema),
    defaultValues: RANGE_DEFAULTS,
  });

  useEffect(() => {
    form.reset(RANGE_DEFAULTS);
    createRange.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSubmit(values: CalendarRangeFormValues) {
    const payload = {
      start_date: values.start_date,
      end_date: values.end_date,
      day_type: values.day_type,
      label: values.label || null,
      half_day_end_time: values.day_type === 'half_day' ? values.half_day_end_time || null : null,
    };

    void createRange.mutateAsync(payload).then(onDone);
  }

  const dayType = form.watch('day_type');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormItem>
          <FormLabel>Date range</FormLabel>
          <FormControl>
            <BsDateRangePicker
              startValue={form.watch('start_date')}
              endValue={form.watch('end_date')}
              onChange={(start, end) => {
                form.setValue('start_date', start, { shouldValidate: true });
                form.setValue('end_date', end, { shouldValidate: true });
              }}
            />
          </FormControl>
          {(form.formState.errors.start_date || form.formState.errors.end_date) && (
            <p className="text-sm text-destructive">
              {form.formState.errors.start_date?.message ?? form.formState.errors.end_date?.message}
            </p>
          )}
        </FormItem>
        <DayTypeAndLabelFields control={form.control} dayType={dayType} />

        {createRange.isError && (
          <p className="text-sm text-destructive">{extractErrorMessage(createRange.error)}</p>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit" disabled={createRange.isPending}>
            {createRange.isPending ? 'Adding…' : 'Add range'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

interface SharedCalendarFields {
  day_type: 'working' | 'holiday' | 'half_day' | 'exam_day';
  label?: string;
  half_day_end_time?: string;
}

/** Shared Day type / Label / (conditional) Half-day-end-time fields —
 *  identical between the single and range forms, just bound to whichever
 *  form's control is passed in. Generic over T (constrained to
 *  SharedCalendarFields) so both CalendarEntryFormValues and
 *  CalendarRangeFormValues type-check here without an `any`, since both
 *  genuinely share these three field names and value types. */
function DayTypeAndLabelFields<T extends SharedCalendarFields>({
  control,
  dayType,
}: {
  control: Control<T>;
  dayType: string;
}) {
  return (
    <>
      <FormField
        control={control}
        name={'day_type' as Path<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Day type</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {DAY_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={'label' as Path<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Label (optional)</FormLabel>
            <FormControl>
              <Input {...field} placeholder="e.g. Dashain" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {dayType === 'half_day' && (
        <FormField
          control={control}
          name={'half_day_end_time' as Path<T>}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Half day ends at</FormLabel>
              <FormControl>
                <Input type="time" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </>
  );
}

export function CalendarEntryFormDialog({ open, onOpenChange, entry }: CalendarEntryFormDialogProps) {
  const isEdit = Boolean(entry);
  const [mode, setMode] = useState<'single' | 'range'>('single');
  // Resets the mode toggle back to "single" each time the dialog opens,
  // without an effect (React's "adjusting state during rendering"
  // pattern: https://react.dev/learn/you-might-not-need-an-effect) —
  // an effect here would setState synchronously on mount/update, which
  // triggers a disallowed cascading re-render.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setMode('single');
    }
  }

  function close() {
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit Calendar Entry' : mode === 'range' ? 'Add Date Range' : 'Add Calendar Entry'}
          </DialogTitle>
        </DialogHeader>

        {!isEdit && (
          <div className="flex gap-1 rounded-md bg-muted p-1">
            <button
              type="button"
              onClick={() => setMode('single')}
              className={cn(
                'flex-1 rounded-sm px-2 py-1 text-sm font-medium transition-colors',
                mode === 'single' ? 'bg-background shadow-sm' : 'text-muted-foreground',
              )}
            >
              Single date
            </button>
            <button
              type="button"
              onClick={() => setMode('range')}
              className={cn(
                'flex-1 rounded-sm px-2 py-1 text-sm font-medium transition-colors',
                mode === 'range' ? 'bg-background shadow-sm' : 'text-muted-foreground',
              )}
            >
              Date range
            </button>
          </div>
        )}

        {mode === 'range' && !isEdit ? (
          <RangeEntryForm onDone={close} />
        ) : (
          <SingleEntryForm entry={entry} onDone={close} />
        )}
      </DialogContent>
    </Dialog>
  );
}
