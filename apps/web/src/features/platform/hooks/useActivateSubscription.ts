import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { platformApi } from '../api/platformApi';

export function useActivateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: platformApi.activateSubscription,
    onSuccess: (school) => {
      void queryClient.invalidateQueries({ queryKey: ['platform', 'schools'] });
      toast.success(`Subscription activated for ${school.name} — expires ${school.amc_expiry_date}.`);
    },
  });
}
