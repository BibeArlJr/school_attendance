import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { parentsApi } from '../api/parentsApi';

export function useCreateParent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: parentsApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['parents'] });
      toast.success('Parent created successfully.');
    },
  });
}
