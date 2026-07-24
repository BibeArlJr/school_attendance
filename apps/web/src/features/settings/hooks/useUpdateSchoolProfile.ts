import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { settingsApi } from '../api/settingsApi';

export function useUpdateSchoolProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: settingsApi.updateSchool,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['settings', 'school'] });
      toast.success('School profile updated successfully.');
    },
  });
}
