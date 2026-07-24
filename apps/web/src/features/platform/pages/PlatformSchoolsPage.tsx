import { Plus } from 'lucide-react';
import { useState } from 'react';
import { CreateSchoolFormDialog } from '../components/CreateSchoolFormDialog';
import { useActivateSubscription } from '../hooks/useActivateSubscription';
import { useSchools } from '../hooks/useSchools';
import { useSetActiveSchool } from '../hooks/useSetActiveSchool';
import type { LicenseStatusValue } from '../types';
import { useAuthStore } from '@/features/auth/store/authStore';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { LoadingSkeleton } from '@/shared/components/feedback/LoadingSkeleton';
import { PageContainer } from '@/shared/components/layout/PageContainer';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';

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

export default function PlatformSchoolsPage() {
  const schoolsQuery = useSchools();
  const setActiveSchool = useSetActiveSchool();
  const activateSubscription = useActivateSubscription();
  const activeSchoolId = useAuthStore((state) => state.user?.active_school?.id);
  const [formOpen, setFormOpen] = useState(false);

  return (
    <PageContainer
      title="Platform Console"
      description="Create and manage every school on this platform, and pick which one you're currently operating as."
    >
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="size-4" />
          Create School
        </Button>
      </div>

      {schoolsQuery.isLoading ? (
        <LoadingSkeleton lines={4} />
      ) : schoolsQuery.isError ? (
        <ErrorState onRetry={() => schoolsQuery.refetch()} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Students</TableHead>
              <TableHead>Staff</TableHead>
              <TableHead>License</TableHead>
              <TableHead>Created</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {schoolsQuery.data?.map((school) => (
              <TableRow key={school.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {school.name}
                    {activeSchoolId === school.id && <Badge>Active</Badge>}
                  </div>
                </TableCell>
                <TableCell>{school.school_code}</TableCell>
                <TableCell>{school.students_count}</TableCell>
                <TableCell>{school.staff_count}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <Badge variant={LICENSE_VARIANT[school.computed_license_status]} className="w-fit">
                      {LICENSE_LABEL[school.computed_license_status]}
                    </Badge>
                    {school.days_until_expiry !== null && (
                      <span className="text-xs text-muted-foreground">
                        {school.days_until_expiry >= 0
                          ? `${school.days_until_expiry}d left`
                          : `expired ${Math.abs(school.days_until_expiry)}d ago`}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>{school.created_at.slice(0, 10)}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={activateSubscription.isPending}
                      onClick={() => activateSubscription.mutate(school.id)}
                    >
                      {school.computed_license_status === 'active' && school.amc_expiry_date
                        ? 'Extend'
                        : 'Activate Subscription'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={activeSchoolId === school.id || setActiveSchool.isPending}
                      onClick={() => setActiveSchool.mutate(school.id)}
                    >
                      {activeSchoolId === school.id ? 'Managing this school' : 'Manage this school'}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <CreateSchoolFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </PageContainer>
  );
}
