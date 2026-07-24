import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { teachersApi } from '../api/teachersApi';

export function useDeleteTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => teachersApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast.success('Teacher deleted.');
    },
  });
}
