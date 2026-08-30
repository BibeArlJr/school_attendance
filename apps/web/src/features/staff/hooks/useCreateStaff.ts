import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { staffApi } from '../api/staffApi';

export function useCreateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: staffApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Staff member added — ID card generated.');
    },
  });
}
