import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { usersApi } from '../api/usersApi';
import type { EmploymentStatus } from '../types';

export function useUpdateEmploymentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, employmentStatus }: { id: string; employmentStatus: EmploymentStatus }) =>
      usersApi.updateEmploymentStatus(id, employmentStatus),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Employment status updated.');
    },
  });
}
