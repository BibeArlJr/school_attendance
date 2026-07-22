import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { teachersApi } from '../api/teachersApi';
import type { TeacherFormValues } from '../schema';

export function useUpdateTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, values }: { id: number; values: TeacherFormValues }) => teachersApi.update(id, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast.success('Teacher updated successfully.');
    },
  });
}
