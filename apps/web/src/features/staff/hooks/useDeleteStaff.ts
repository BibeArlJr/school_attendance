import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { staffApi } from '../api/staffApi';

export function useDeleteStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => staffApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Staff member deleted.');
    },
  });
}
