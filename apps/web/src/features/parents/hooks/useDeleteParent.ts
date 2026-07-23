import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { parentsApi } from '../api/parentsApi';

export function useDeleteParent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => parentsApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['parents'] });
      toast.success('Parent deleted.');
    },
  });
}
