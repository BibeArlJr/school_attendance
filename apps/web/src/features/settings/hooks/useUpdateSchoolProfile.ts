import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { settingsApi } from '../api/settingsApi';
import { useAuthStore } from '@/features/auth/store/authStore';

export function useUpdateSchoolProfile() {
  const queryClient = useQueryClient();
  const updateOwnSchoolBranding = useAuthStore((state) => state.updateOwnSchoolBranding);

  return useMutation({
    mutationFn: settingsApi.updateSchool,
    onSuccess: (school) => {
      void queryClient.invalidateQueries({ queryKey: ['settings', 'school'] });
      // Keeps the SchoolThemeProvider's accent/background live immediately
      // — it only reacts to authStore.branding, not this query's cache.
      updateOwnSchoolBranding({
        primary_color: school.primary_color,
        background_color: school.background_color,
      });
      toast.success('School profile updated successfully.');
    },
  });
}
