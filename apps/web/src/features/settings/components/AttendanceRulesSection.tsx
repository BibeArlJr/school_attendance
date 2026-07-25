import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAttendanceConfig } from '../hooks/useSettingsQueries';
import { useUpdateAttendanceConfig } from '../hooks/useUpdateAttendanceConfig';
import { attendanceConfigSchema, type AttendanceConfigFormValues } from '../schema';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { LoadingSkeleton } from '@/shared/components/feedback/LoadingSkeleton';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Checkbox } from '@/shared/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { LICENSE_EXPIRED_MESSAGE, useLicenseExpired } from '@/shared/hooks/useLicenseExpired';
import { extractErrorMessage } from '@/shared/lib/errors';

const WEEKDAYS = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

export function AttendanceRulesSection() {
  const licenseExpired = useLicenseExpired();
  const configQuery = useAttendanceConfig();
  const updateConfig = useUpdateAttendanceConfig();

  const form = useForm<AttendanceConfigFormValues>({
    resolver: zodResolver(attendanceConfigSchema),
    defaultValues: {
      start_time: '',
      end_time: '',
      late_threshold_minutes: '0',
      early_departure_threshold_minutes: '0',
      duplicate_scan_window_seconds: '0',
      working_days: [],
    },
  });

  useEffect(() => {
    if (configQuery.data) {
      form.reset({
        start_time: configQuery.data.start_time.slice(0, 5),
        end_time: configQuery.data.end_time.slice(0, 5),
        late_threshold_minutes: String(configQuery.data.late_threshold_minutes),
        early_departure_threshold_minutes: String(
          configQuery.data.early_departure_threshold_minutes,
        ),
        duplicate_scan_window_seconds: String(configQuery.data.duplicate_scan_window_seconds),
        working_days: configQuery.data.working_days,
      });
    }
  }, [configQuery.data, form]);

  function onSubmit(values: AttendanceConfigFormValues) {
    updateConfig.mutate({
      start_time: values.start_time,
      end_time: values.end_time,
      late_threshold_minutes: Number(values.late_threshold_minutes),
      early_departure_threshold_minutes: Number(values.early_departure_threshold_minutes),
      duplicate_scan_window_seconds: Number(values.duplicate_scan_window_seconds),
      working_days: values.working_days,
    });
  }

  if (configQuery.isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <LoadingSkeleton lines={4} />
        </CardContent>
      </Card>
    );
  }

  if (configQuery.isError || !configQuery.data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <ErrorState onRetry={() => configQuery.refetch()} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Rules</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex gap-2 rounded-md border border-amber-400 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p>
            Changes here take effect <strong>immediately for future scans</strong> — the gate
            scanner reads these rules live on every scan. They do <strong>not</strong>{' '}
            retroactively change any attendance record already on file, and they also change how
            today&apos;s and future absences are calculated on the Dashboard and in Reports.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="end_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="late_threshold_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Late after (min)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} max={240} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="early_departure_threshold_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Early departure (min)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} max={240} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="duplicate_scan_window_seconds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duplicate scan window (sec)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} max={3600} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="working_days"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Working days</FormLabel>
                  <div className="flex flex-wrap gap-4">
                    {WEEKDAYS.map((day) => (
                      <label key={day.value} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={field.value.includes(day.value)}
                          onCheckedChange={(checked) => {
                            field.onChange(
                              checked
                                ? [...field.value, day.value].sort()
                                : field.value.filter((d) => d !== day.value),
                            );
                          }}
                        />
                        {day.label}
                      </label>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={updateConfig.isPending || licenseExpired}
              title={licenseExpired ? LICENSE_EXPIRED_MESSAGE : undefined}
            >
              {updateConfig.isPending ? 'Saving…' : 'Save changes'}
            </Button>
            {updateConfig.isError && (
              <p className="text-sm text-destructive">{extractErrorMessage(updateConfig.error)}</p>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
