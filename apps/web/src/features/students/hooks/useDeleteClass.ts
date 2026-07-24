import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { classesApi } from '../api/studentsApi';

export function useDeleteClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => classesApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Class deleted.');
    },
  });
}
