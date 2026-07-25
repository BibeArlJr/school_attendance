import { AlertTriangle, Info, TriangleAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/app/router/routes';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useLicense } from '@/features/settings/hooks/useSettingsQueries';
import { cn } from '@/shared/lib/utils';

type Urgency = 'neutral' | 'warning' | 'urgent';

const URGENCY_STYLES: Record<Urgency, string> = {
  neutral:
    'border-sky-300 bg-sky-50 text-sky-900 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300',
  warning:
    'border-amber-400 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
  urgent:
    'border-destructive/50 bg-destructive/5 text-destructive dark:bg-destructive/10',
};

const URGENCY_ICON: Record<Urgency, typeof Info> = {
  neutral: Info,
  warning: AlertTriangle,
  urgent: TriangleAlert,
};

function urgencyFor(daysRemaining: number): Urgency {
  if (daysRemaining > 15) return 'neutral';
  if (daysRemaining > 7) return 'warning';
  return 'urgent';
}

function daysText(daysRemaining: number): string {
  if (daysRemaining < 0) return `expired ${Math.abs(daysRemaining)} day(s) ago`;
  if (daysRemaining === 0) return 'expires today';
  return `expires in ${daysRemaining} day(s)`;
}

/**
 * Persistent, admin/super_admin-only banner shown once within 30 days of
 * license expiry, escalating in urgency as the countdown shrinks (Prompt
 * 33 Part B) — teacher/guard can't act on renewal, so they never see it.
 * Reuses GET /settings/license (already built for the Settings page's own
 * license card) rather than a parallel endpoint.
 */
export function LicenseBanner() {
  const user = useAuthStore((state) => state.user);
  const role = user?.role;
  const eligible = role === 'admin' || role === 'super_admin';
  const hasSchoolContext = role === 'super_admin' ? Boolean(user?.active_school) : true;

  const licenseQuery = useLicense(eligible && hasSchoolContext);
  const data = licenseQuery.data;

  if (!eligible || !data || data.days_until_expiry === null || data.days_until_expiry > 30) {
    return null;
  }

  const daysRemaining = data.days_until_expiry;
  const urgency = urgencyFor(daysRemaining);
  const Icon = URGENCY_ICON[urgency];

  return (
    <div
      className={cn(
        'flex items-center gap-3 border-b px-4 py-2 text-sm print:hidden',
        URGENCY_STYLES[urgency],
      )}
    >
      <Icon className="size-4 shrink-0" />
      <p className="flex-1">
        <span className="font-medium">Subscription {daysText(daysRemaining)}.</span>{' '}
        {role === 'super_admin'
          ? 'Renew from the Platform Console before write access is blocked.'
          : 'Contact your platform administrator to renew before write access is blocked.'}
      </p>
      {role === 'super_admin' && (
        <Link to={ROUTES.PLATFORM_SCHOOLS} className="shrink-0 font-medium underline underline-offset-2">
          Platform Console
        </Link>
      )}
    </div>
  );
}
