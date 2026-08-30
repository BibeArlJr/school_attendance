import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { staffApi } from '../api/staffApi';
import type { StaffEmploymentStatus } from '../types';

export function useUpdateStaffEmploymentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, employmentStatus }: { id: string; employmentStatus: StaffEmploymentStatus }) =>
      staffApi.updateEmploymentStatus(id, employmentStatus),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Employment status updated.');
    },
  });
}
