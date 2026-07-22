import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { studentsApi } from '../api/studentsApi';

export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: studentsApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student created successfully.');
    },
  });
}
