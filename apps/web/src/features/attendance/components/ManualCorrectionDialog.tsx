import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useUpdateAttendanceRecord } from '../hooks/useUpdateAttendanceRecord';
import { manualCorrectionSchema, type ManualCorrectionFormValues } from '../schema';
import type { AttendanceRecord } from '../types';
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

interface ManualCorrectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: AttendanceRecord | null;
}

function defaultsFor(record: AttendanceRecord | null): ManualCorrectionFormValues {
  return {
    in_time: record?.in_time?.slice(0, 5) ?? '',
    out_time: record?.out_time?.slice(0, 5) ?? '',
    status: record?.status,
    override_reason: '',
  };
}

export function ManualCorrectionDialog({ open, onOpenChange, record }: ManualCorrectionDialogProps) {
  const updateRecord = useUpdateAttendanceRecord();

  const form = useForm<ManualCorrectionFormValues>({
    resolver: zodResolver(manualCorrectionSchema),
    defaultValues: defaultsFor(record),
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultsFor(record));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, record]);

  function onSubmit(values: ManualCorrectionFormValues) {
    if (!record) {
      return;
    }

    void updateRecord
      .mutateAsync({
        recordId: record.id,
        override_reason: values.override_reason,
        in_time: values.in_time ? `${values.in_time}:00` : undefined,
        out_time: values.out_time ? `${values.out_time}:00` : undefined,
        status: values.status,
      })
      .then(() => onOpenChange(false));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Correct attendance{record?.student ? ` — ${record.student.first_name} ${record.student.last_name}` : ''}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="in_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>In time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="out_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Out time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="present">Present</SelectItem>
                      <SelectItem value="late">Late</SelectItem>
                      <SelectItem value="absent">Absent</SelectItem>
                      <SelectItem value="half_day">Half day</SelectItem>
                      <SelectItem value="out_without_in">Out without in</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="override_reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for correction</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Why is this being corrected?" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={updateRecord.isPending}>
                {updateRecord.isPending ? 'Saving…' : 'Save correction'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
