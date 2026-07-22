import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { attendanceApi } from '../api/attendanceApi';

export function useReviewAnomaly() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, reviewNote }: { eventId: number; reviewNote?: string }) =>
      attendanceApi.reviewEvent(eventId, reviewNote),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['attendance', 'anomalies'] });
      toast.success('Event marked reviewed.');
    },
  });
}
