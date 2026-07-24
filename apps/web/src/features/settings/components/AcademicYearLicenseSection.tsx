import { AlertTriangle, TriangleAlert } from 'lucide-react';
import { useAcademicYear, useLicense } from '../hooks/useSettingsQueries';
import type { LicenseStatusValue } from '../types';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { LoadingSkeleton } from '@/shared/components/feedback/LoadingSkeleton';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';

const STATUS_LABEL: Record<LicenseStatusValue, string> = {
  active: 'Active',
  grace: 'Grace period',
  expired: 'Expired',
};

const STATUS_VARIANT: Record<LicenseStatusValue, 'default' | 'secondary' | 'outline'> = {
  active: 'default',
  grace: 'secondary',
  expired: 'outline',
};

export function AcademicYearLicenseSection() {
  const academicYearQuery = useAcademicYear();
  const licenseQuery = useLicense();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Academic Year</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          {academicYearQuery.isLoading ? (
            <LoadingSkeleton lines={2} />
          ) : academicYearQuery.isError ? (
            <ErrorState onRetry={() => academicYearQuery.refetch()} />
          ) : !academicYearQuery.data ? (
            <EmptyState title="No current academic year set" />
          ) : (
            <>
              <p>
                <span className="text-muted-foreground">Label:</span>{' '}
                {academicYearQuery.data.label}
              </p>
              <p>
                <span className="text-muted-foreground">Start date:</span>{' '}
                {academicYearQuery.data.start_date.slice(0, 10)}
              </p>
              <p>
                <span className="text-muted-foreground">End date:</span>{' '}
                {academicYearQuery.data.end_date.slice(0, 10)}
              </p>
              <p className="flex items-center gap-2 pt-1">
                <Badge>Current</Badge>
              </p>
              <p className="pt-2 text-xs text-muted-foreground">
                Read-only here — rolling over to a new academic year is its own future phase, not
                built yet.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>License</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {licenseQuery.isLoading ? (
            <LoadingSkeleton lines={2} />
          ) : licenseQuery.isError || !licenseQuery.data ? (
            <ErrorState onRetry={() => licenseQuery.refetch()} />
          ) : (
            <>
              <p className="flex items-center gap-2">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={STATUS_VARIANT[licenseQuery.data.status]}>
                  {STATUS_LABEL[licenseQuery.data.status]}
                </Badge>
              </p>
              <p>
                <span className="text-muted-foreground">AMC expiry date:</span>{' '}
                {licenseQuery.data.amc_expiry_date ?? '— (never activated)'}
              </p>
              {licenseQuery.data.days_until_expiry !== null && (
                <p>
                  <span className="text-muted-foreground">Days remaining:</span>{' '}
                  {licenseQuery.data.days_until_expiry >= 0
                    ? licenseQuery.data.days_until_expiry
                    : `Expired ${Math.abs(licenseQuery.data.days_until_expiry)} day(s) ago`}
                </p>
              )}

              {licenseQuery.data.status === 'grace' && (
                <div className="flex gap-2 rounded-md border border-amber-400 bg-amber-50 p-3 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <p>
                    Your subscription expires in {licenseQuery.data.days_until_expiry} day(s).
                    Contact your platform administrator to renew before it expires — write access
                    (adding/editing students, teachers, parents, attendance corrections) will be
                    blocked once it does.
                  </p>
                </div>
              )}

              {licenseQuery.data.status === 'expired' && (
                <div className="flex gap-2 rounded-md border border-destructive/50 bg-destructive/5 p-3 text-destructive">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                  <p>
                    Your subscription has expired. All data is still viewable, but write actions
                    (adding/editing students, teachers, parents, attendance corrections) are
                    blocked until your platform administrator reactivates it.
                  </p>
                </div>
              )}

              <p className="pt-1 text-xs text-muted-foreground">
                Read-only here — activating or renewing a subscription is done from the Platform
                Console by a super admin, not from this page.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
