import { useParams } from 'react-router-dom';
import { useUserMember } from '../hooks/useUserMember';
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

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const userQuery = useUserMember(id ?? '');

  if (userQuery.isLoading) {
    return (
      <PageContainer title="Users">
        <LoadingSkeleton lines={4} />
      </PageContainer>
    );
  }

  const account = userQuery.data;
  if (!account) {
    return (
      <PageContainer title="Users">
        <EmptyState title="User not found" />
      </PageContainer>
    );
  }

  return (
    <PageContainer title={account.name} description={account.designation ?? undefined}>
      <Card>
        <CardHeader>
          <CardTitle>{ROLE_INFO_TITLE[account.role] ?? 'User info'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>
            <span className="text-muted-foreground">Email:</span> {account.email}
          </p>
          <p>
            <span className="text-muted-foreground">Role:</span>{' '}
            <span className="capitalize">{account.role}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Designation:</span>{' '}
            {account.designation ?? '—'}
          </p>
          <p className="flex items-center gap-2">
            <span className="text-muted-foreground">Employment status:</span>
            <Badge variant={STATUS_VARIANT[account.employment_status]} className="capitalize">
              {account.employment_status.replace('_', ' ')}
            </Badge>
          </p>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
