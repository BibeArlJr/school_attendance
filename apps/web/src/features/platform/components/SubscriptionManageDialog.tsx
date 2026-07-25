import { useState } from 'react';
import { useCancelSubscription, useExtendSubscription, useSetSubscriptionExpiry } from '../hooks/useSubscriptionMutations';
import type { LicenseStatusValue, PlatformSchool } from '../types';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Separator } from '@/shared/components/ui/separator';

interface SubscriptionManageDialogProps {
  school: PlatformSchool | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LICENSE_LABEL: Record<LicenseStatusValue, string> = {
  active: 'Active',
  grace: 'Grace period',
  expired: 'Expired',
};

const LICENSE_VARIANT: Record<LicenseStatusValue, 'default' | 'secondary' | 'outline'> = {
  active: 'default',
  grace: 'secondary',
  expired: 'outline',
};

const QUICK_DURATIONS = [
  { label: '+7 days', days: 7 },
  { label: '+30 days', days: 30 },
  { label: '+90 days', days: 90 },
  { label: '+1 year', days: 365 },
];

/**
 * Replaces the single "Activate Subscription"/"Extend" button (Prompt
 * 25 Part C) with a real management panel (Prompt 26 Part C revision):
 * quick-duration extension, a manual expiry override that can also
 * shorten an active subscription, and an explicitly-confirmed immediate
 * cancellation. All three write the same amc_expiry_date/license_status
 * fields the existing live-computed status/enforcement logic already
 * reads — no new enforcement path, just more ways to set the date.
 */
export function SubscriptionManageDialog({ school, open, onOpenChange }: SubscriptionManageDialogProps) {
  const extendSubscription = useExtendSubscription();
  const setSubscriptionExpiry = useSetSubscriptionExpiry();
  const cancelSubscription = useCancelSubscription();

  const [manualDate, setManualDate] = useState('');
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  // Resets the form fields only on the open-transition, not on every
  // background refetch of `school` while the dialog stays open (which
  // would otherwise clobber whatever date the user is mid-typing) —
  // React's "adjusting state during rendering" pattern
  // (https://react.dev/learn/you-might-not-need-an-effect) rather than
  // an effect, since setState synchronously in an effect body is
  // disallowed (triggers a cascading re-render).
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setManualDate(school?.amc_expiry_date ?? '');
      setConfirmCancelOpen(false);
    }
  }

  if (!school) {
    return null;
  }

  const isPending =
    extendSubscription.isPending || setSubscriptionExpiry.isPending || cancelSubscription.isPending;

  function handleManualSubmit() {
    if (!manualDate) return;
    setSubscriptionExpiry.mutate({ schoolId: school!.id, amcExpiryDate: manualDate });
  }

  function handleCancelConfirm() {
    cancelSubscription.mutate(school!.id, {
      onSuccess: () => setConfirmCancelOpen(false),
    });
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Subscription — {school.name}</DialogTitle>
          </DialogHeader>

          <div className="flex items-center gap-2">
            <Badge variant={LICENSE_VARIANT[school.computed_license_status]}>
              {LICENSE_LABEL[school.computed_license_status]}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {school.amc_expiry_date
                ? `Expires ${school.amc_expiry_date}${
                    school.days_until_expiry !== null
                      ? school.days_until_expiry >= 0
                        ? ` (${school.days_until_expiry}d left)`
                        : ` (expired ${Math.abs(school.days_until_expiry)}d ago)`
                      : ''
                  }`
                : 'No expiry set (treated as active)'}
            </span>
          </div>

          <div className="space-y-2">
            <Label>Quick extend</Label>
            <div className="flex flex-wrap gap-2">
              {QUICK_DURATIONS.map((duration) => (
                <Button
                  key={duration.days}
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={() => extendSubscription.mutate({ schoolId: school.id, days: duration.days })}
                >
                  {duration.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="manual-expiry">Set exact expiry date</Label>
            <div className="flex gap-2">
              <Input
                id="manual-expiry"
                type="date"
                value={manualDate}
                onChange={(e) => setManualDate(e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                disabled={isPending || !manualDate}
                onClick={handleManualSubmit}
              >
                Set
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              An earlier date shortens an active subscription immediately — no separate "reduce"
              action, just set the date directly.
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Button
              type="button"
              variant="destructive"
              disabled={isPending}
              onClick={() => setConfirmCancelOpen(true)}
            >
              Cancel Subscription Now
            </Button>
            <p className="text-xs text-muted-foreground">
              Immediately expires the subscription — writes are blocked school-wide right away,
              same as natural expiry. Reads stay open.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmCancelOpen} onOpenChange={setConfirmCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel {school.name}'s subscription now?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This takes effect immediately — anyone using {school.name}'s account right now will
            have write access blocked (reads still work) until the subscription is reactivated or
            extended. This is not reversible by undo; you'd need to extend or set a new expiry
            date to restore access.
          </p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmCancelOpen(false)}>
              Keep subscription
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={cancelSubscription.isPending}
              onClick={handleCancelConfirm}
            >
              {cancelSubscription.isPending ? 'Canceling…' : 'Yes, cancel now'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
