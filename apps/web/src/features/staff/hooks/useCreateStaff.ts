import { useMutation, useQueryClient } from '@tanstack/react-query';
import { staffApi } from '../api/staffApi';

export function useCreateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: staffApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });
}
