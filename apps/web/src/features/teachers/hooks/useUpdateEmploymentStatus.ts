import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { teachersApi } from '../api/teachersApi';
import type { EmploymentStatus } from '../types';

export function useUpdateEmploymentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, employmentStatus }: { id: string; employmentStatus: EmploymentStatus }) =>
      teachersApi.updateEmploymentStatus(id, employmentStatus),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast.success('Employment status updated.');
    },
  });
}
