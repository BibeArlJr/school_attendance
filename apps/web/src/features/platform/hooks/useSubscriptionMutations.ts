import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { platformApi } from '../api/platformApi';
import { formatBs } from '@/shared/lib/bikramSambat';

export function useExtendSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ schoolId, days }: { schoolId: number; days?: number }) =>
      platformApi.extendSubscription(schoolId, days),
    onSuccess: (school) => {
      void queryClient.invalidateQueries({ queryKey: ['platform', 'schools'] });
      const expiry = school.amc_expiry_date ? formatBs(school.amc_expiry_date) : 'no expiry';
      toast.success(`Subscription extended for ${school.name} — expires ${expiry}.`);
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
      const expiry = school.amc_expiry_date ? formatBs(school.amc_expiry_date) : 'no expiry';
      toast.success(`Expiry updated for ${school.name} — now expires ${expiry}.`);
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

// Deliberately separate from the subscription hooks above (Prompt 35
// Part E) — deactivation is a platform-level suspension, not a
// license-expiry action, even though both invalidate the same list.
export function useDeactivateSchool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: platformApi.deactivateSchool,
    onSuccess: (school) => {
      void queryClient.invalidateQueries({ queryKey: ['platform', 'schools'] });
      toast.success(`${school.name} deactivated — all logins for this school are now blocked.`);
    },
  });
}

export function useReactivateSchool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: platformApi.reactivateSchool,
    onSuccess: (school) => {
      void queryClient.invalidateQueries({ queryKey: ['platform', 'schools'] });
      toast.success(`${school.name} reactivated — logins are restored.`);
    },
  });
}

// Real delete, not another status action — only for undoing a mistaken
// school creation. The backend enforces its own two gates (already
// deactivated, zero real students/staff) regardless of what the UI
// allows clicking; a blocked attempt surfaces here as a normal mutation
// error, shown verbatim via DeleteConfirmDialog's errorMessage prop.
export function useDeleteSchool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: platformApi.deleteSchool,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['platform', 'schools'] });
      toast.success('School deleted.');
    },
  });
}
