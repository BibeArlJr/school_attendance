import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { attendanceApi } from '../api/attendanceApi';

interface UpdateRecordInput {
  recordId: number;
  override_reason: string;
  in_time?: string;
  out_time?: string;
  status?: string;
  late?: boolean;
  early_departure?: boolean;
}

export function useUpdateAttendanceRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recordId, ...values }: UpdateRecordInput) =>
      attendanceApi.updateRecord(recordId, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['attendance', 'records'] });
      toast.success('Attendance record updated.');
    },
  });
}
