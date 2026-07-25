import { useState } from 'react';
import {
  useCancelSubscription,
  useDeactivateSchool,
  useExtendSubscription,
  useReactivateSchool,
  useSetSubscriptionExpiry,
} from '../hooks/useSubscriptionMutations';
import type { LicenseStatusValue, PlatformSchool } from '../types';
import { BsDatePicker } from '@/shared/components/BsDatePicker';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';
import { Separator } from '@/shared/components/ui/separator';
import { formatBs } from '@/shared/lib/bikramSambat';

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
  const deactivateSchool = useDeactivateSchool();
  const reactivateSchool = useReactivateSchool();

  const [manualDate, setManualDate] = useState('');
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [confirmDeactivateOpen, setConfirmDeactivateOpen] = useState(false);
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
      setConfirmDeactivateOpen(false);
    }
  }

  if (!school) {
    return null;
  }

  const isPending =
    extendSubscription.isPending
    || setSubscriptionExpiry.isPending
    || cancelSubscription.isPending
    || deactivateSchool.isPending
    || reactivateSchool.isPending;

  function handleManualSubmit() {
    if (!manualDate) return;
    setSubscriptionExpiry.mutate({ schoolId: school!.id, amcExpiryDate: manualDate });
  }

  function handleCancelConfirm() {
    cancelSubscription.mutate(school!.id, {
      onSuccess: () => setConfirmCancelOpen(false),
    });
  }

  function handleDeactivateConfirm() {
    deactivateSchool.mutate(school!.id, {
      onSuccess: () => setConfirmDeactivateOpen(false),
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
                ? `Expires ${formatBs(school.amc_expiry_date)}${
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
            <Label>Set exact expiry date</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <BsDatePicker value={manualDate} onChange={setManualDate} />
              </div>
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

          <Separator />

          <div className="space-y-2 rounded-md border border-destructive/50 bg-destructive/5 p-3">
            <div className="flex items-center gap-2">
              <Label>Platform access</Label>
              <Badge variant={school.is_active ? 'default' : 'destructive'}>
                {school.is_active ? 'Active' : 'Suspended'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Distinct from the subscription above — this is a platform-level suspension, not a
              billing action. A deactivated school's login is blocked entirely, for every user
              including its own admin, whether or not the subscription is current. No data is
              touched.
            </p>
            {school.is_active ? (
              <Button
                type="button"
                variant="destructive"
                disabled={isPending}
                onClick={() => setConfirmDeactivateOpen(true)}
              >
                Deactivate School
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => reactivateSchool.mutate(school.id)}
              >
                {reactivateSchool.isPending ? 'Reactivating…' : 'Reactivate School'}
              </Button>
            )}
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

      <Dialog open={confirmDeactivateOpen} onOpenChange={setConfirmDeactivateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate {school.name}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This is not the same as expiring the subscription — it blocks every login for this
            school immediately, including the school's own admin. Nobody at {school.name} will be
            able to sign in at all, even to read data, until you reactivate. No data is deleted or
            changed beyond this.
          </p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmDeactivateOpen(false)}>
              Keep active
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deactivateSchool.isPending}
              onClick={handleDeactivateConfirm}
            >
              {deactivateSchool.isPending ? 'Deactivating…' : 'Yes, deactivate now'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
