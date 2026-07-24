import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { studentsApi } from '../api/studentsApi';
import type { StudentFormValues } from '../schema';

export function useUpdateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: StudentFormValues }) =>
      studentsApi.update(id, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student updated successfully.');
    },
  });
}
