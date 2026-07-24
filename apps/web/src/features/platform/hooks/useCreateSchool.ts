import { useMutation, useQueryClient } from '@tanstack/react-query';
import { platformApi } from '../api/platformApi';

export function useCreateSchool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: platformApi.createSchool,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['platform', 'schools'] });
    },
  });
}
