import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { staffApi } from '../api/staffApi';
import type { EmploymentStatus } from '../types';

export function useUpdateEmploymentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, employmentStatus }: { id: string; employmentStatus: EmploymentStatus }) =>
      staffApi.updateEmploymentStatus(id, employmentStatus),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Employment status updated.');
    },
  });
}
