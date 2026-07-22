import { useMutation, useQueryClient } from '@tanstack/react-query';
import { teachersApi } from '../api/teachersApi';

export function useCreateTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: teachersApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['teachers'] });
    },
  });
}
