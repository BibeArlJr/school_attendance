import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { settingsApi } from '../api/settingsApi';
import { useAuthStore } from '@/features/auth/store/authStore';

export function useUploadSchoolLogo() {
  const queryClient = useQueryClient();
  const updateOwnSchoolBranding = useAuthStore((state) => state.updateOwnSchoolBranding);

  return useMutation({
    mutationFn: settingsApi.uploadLogo,
    onSuccess: (school) => {
      void queryClient.invalidateQueries({ queryKey: ['settings', 'school'] });
      // Keeps the Topbar/Login logo live immediately — it only reacts to
      // authStore.branding, not this query's cache.
      updateOwnSchoolBranding({ logo_url: school.logo_url });
      toast.success('Logo updated successfully.');
    },
  });
}
