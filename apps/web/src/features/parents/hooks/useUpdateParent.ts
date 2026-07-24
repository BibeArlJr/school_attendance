import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { parentsApi } from '../api/parentsApi';
import type { ParentFormValues } from '../schema';

export function useUpdateParent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: ParentFormValues }) => parentsApi.update(id, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['parents'] });
      toast.success('Parent updated successfully.');
    },
  });
}
