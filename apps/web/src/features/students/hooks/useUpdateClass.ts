import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { classesApi } from '../api/studentsApi';
import type { ClassFormValues } from '../schema';

export function useUpdateClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, values }: { id: number; values: ClassFormValues }) =>
      classesApi.update(id, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Class updated successfully.');
    },
  });
}
