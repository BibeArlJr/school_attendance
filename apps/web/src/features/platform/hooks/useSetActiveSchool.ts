import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { platformApi } from '../api/platformApi';
import { useAuthStore } from '@/features/auth/store/authStore';

/**
 * Switching schools changes what every school-scoped endpoint returns
 * (Students, Teachers, Attendance, Reports, ...) — clearing the whole
 * query cache (not just invalidating a few keys) is deliberate here so
 * nothing keeps showing the previous school's data from a stale cache
 * entry after the switch.
 */
export function useSetActiveSchool() {
  const queryClient = useQueryClient();
  const setActiveSchool = useAuthStore((state) => state.setActiveSchool);

  return useMutation({
    mutationFn: platformApi.setActiveSchool,
    onSuccess: (school) => {
      setActiveSchool(school);
      queryClient.clear();
      toast.success(`Now managing ${school.name}.`);
    },
  });
}
