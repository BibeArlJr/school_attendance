import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { settingsApi, type CalendarEntryInput } from '../api/settingsApi';

export function useCreateCalendarEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: settingsApi.createCalendarEntry,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['settings', 'calendar'] });
      toast.success('Calendar entry added successfully.');
    },
  });
}

export function useUpdateCalendarEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, values }: { id: number; values: CalendarEntryInput }) =>
      settingsApi.updateCalendarEntry(id, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['settings', 'calendar'] });
      toast.success('Calendar entry updated successfully.');
    },
  });
}

export function useDeleteCalendarEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: settingsApi.deleteCalendarEntry,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['settings', 'calendar'] });
      toast.success('Calendar entry deleted successfully.');
    },
  });
}
