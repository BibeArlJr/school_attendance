import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { classesApi } from '../api/studentsApi';

export function useCreateClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: classesApi.create,
    onSuccess: () => {
      // Real-time invalidation — the Add Student form's class dropdown
      // (also backed by useClasses) picks up new classes without a reload.
      void queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Class created successfully.');
    },
  });
}
