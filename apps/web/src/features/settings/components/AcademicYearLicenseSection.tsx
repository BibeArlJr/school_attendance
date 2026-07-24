import { useAcademicYear } from '../hooks/useSettingsQueries';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { LoadingSkeleton } from '@/shared/components/feedback/LoadingSkeleton';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';

export function AcademicYearLicenseSection() {
  const academicYearQuery = useAcademicYear();

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
        <CardContent className="space-y-1 text-sm">
          <p className="text-muted-foreground">
            License and AMC (Annual Maintenance Contract) tracking isn&apos;t built yet — there's
            no license/expiry data model in this system yet. Full license management is planned
            for a future platform-admin console phase, not this one.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
