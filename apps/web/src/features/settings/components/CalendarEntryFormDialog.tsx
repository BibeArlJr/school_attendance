import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useCreateCalendarEntry, useUpdateCalendarEntry } from '../hooks/useCalendarMutations';
import { calendarEntrySchema, type CalendarEntryFormValues } from '../schema';
import type { SchoolCalendarEntry } from '../types';
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

interface CalendarEntryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: SchoolCalendarEntry | null;
}

function defaultsFor(entry?: SchoolCalendarEntry | null): CalendarEntryFormValues {
  return {
    date: entry?.date.slice(0, 10) ?? '',
    day_type: entry?.day_type ?? 'holiday',
    label: entry?.label ?? '',
    half_day_end_time: entry?.half_day_end_time?.slice(0, 5) ?? '',
  };
}

export function CalendarEntryFormDialog({ open, onOpenChange, entry }: CalendarEntryFormDialogProps) {
  const isEdit = Boolean(entry);
  const createEntry = useCreateCalendarEntry();
  const updateEntry = useUpdateCalendarEntry();
  const mutation = isEdit ? updateEntry : createEntry;

  const form = useForm<CalendarEntryFormValues>({
    resolver: zodResolver(calendarEntrySchema),
    defaultValues: defaultsFor(entry),
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultsFor(entry));
      createEntry.reset();
      updateEntry.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, entry]);

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

    void promise.then(() => onOpenChange(false));
  }

  const dayType = form.watch('day_type');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Calendar Entry' : 'Add Calendar Entry'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="day_type"
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
                      <SelectItem value="holiday">Holiday</SelectItem>
                      <SelectItem value="half_day">Half day</SelectItem>
                      <SelectItem value="exam_day">Exam day</SelectItem>
                      <SelectItem value="working">Working (override)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="label"
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
                control={form.control}
                name="half_day_end_time"
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

            {mutation.isError && (
              <p className="text-sm text-destructive">{extractErrorMessage(mutation.error)}</p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Add entry'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
