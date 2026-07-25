import { useParams } from 'react-router-dom';
import { useStaffMember } from '../hooks/useStaffMember';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { LoadingSkeleton } from '@/shared/components/feedback/LoadingSkeleton';
import { PageContainer } from '@/shared/components/layout/PageContainer';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  active: 'default',
  on_leave: 'secondary',
  resigned: 'outline',
};

const ROLE_INFO_TITLE: Record<string, string> = {
  guard: 'Guard info',
  admin: 'Admin info',
  teacher: 'Teacher info',
};

export default function StaffDetailPage() {
  const { id } = useParams<{ id: string }>();
  const staffQuery = useStaffMember(id ?? '');

  if (staffQuery.isLoading) {
    return (
      <PageContainer title="Staff">
        <LoadingSkeleton lines={4} />
      </PageContainer>
    );
  }

  const staff = staffQuery.data;
  if (!staff) {
    return (
      <PageContainer title="Staff">
        <EmptyState title="Staff member not found" />
      </PageContainer>
    );
  }

  return (
    <PageContainer title={staff.name} description={staff.designation ?? undefined}>
      <Card>
        <CardHeader>
          <CardTitle>{ROLE_INFO_TITLE[staff.role] ?? 'Staff info'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>
            <span className="text-muted-foreground">Email:</span> {staff.email}
          </p>
          <p>
            <span className="text-muted-foreground">Role:</span>{' '}
            <span className="capitalize">{staff.role}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Designation:</span>{' '}
            {staff.designation ?? '—'}
          </p>
          <p className="flex items-center gap-2">
            <span className="text-muted-foreground">Employment status:</span>
            <Badge variant={STATUS_VARIANT[staff.employment_status]} className="capitalize">
              {staff.employment_status.replace('_', ' ')}
            </Badge>
          </p>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
