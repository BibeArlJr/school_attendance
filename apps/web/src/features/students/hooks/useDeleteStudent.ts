import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { studentsApi } from '../api/studentsApi';

export function useDeleteStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => studentsApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student deleted.');
    },
  });
}
