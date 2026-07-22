import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { studentsApi } from '../api/studentsApi';
import type { StudentStatus } from '../types';

export function useUpdateStudentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: StudentStatus }) =>
      studentsApi.updateStatus(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student status updated.');
    },
  });
}
