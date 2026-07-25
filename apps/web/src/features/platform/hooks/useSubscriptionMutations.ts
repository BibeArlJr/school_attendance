import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { platformApi } from '../api/platformApi';

export function useExtendSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ schoolId, days }: { schoolId: number; days?: number }) =>
      platformApi.extendSubscription(schoolId, days),
    onSuccess: (school) => {
      void queryClient.invalidateQueries({ queryKey: ['platform', 'schools'] });
      toast.success(`Subscription extended for ${school.name} — expires ${school.amc_expiry_date}.`);
    },
  });
}

export function useSetSubscriptionExpiry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ schoolId, amcExpiryDate }: { schoolId: number; amcExpiryDate: string }) =>
      platformApi.setSubscriptionExpiry(schoolId, amcExpiryDate),
    onSuccess: (school) => {
      void queryClient.invalidateQueries({ queryKey: ['platform', 'schools'] });
      toast.success(`Expiry updated for ${school.name} — now expires ${school.amc_expiry_date}.`);
    },
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: platformApi.cancelSubscription,
    onSuccess: (school) => {
      void queryClient.invalidateQueries({ queryKey: ['platform', 'schools'] });
      toast.success(`Subscription canceled for ${school.name}.`);
    },
  });
}
