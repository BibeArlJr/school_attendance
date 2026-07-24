import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { settingsApi } from '../api/settingsApi';

export function useUpdateAttendanceConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: settingsApi.updateAttendanceConfig,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['settings', 'attendance-config'] });
      toast.success('Attendance rules updated successfully.');
    },
  });
}
