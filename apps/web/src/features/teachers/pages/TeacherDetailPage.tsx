import { useParams } from 'react-router-dom';
import { StaffIdCardSection } from '../components/StaffIdCardSection';
import { useTeacher } from '../hooks/useTeacher';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { LoadingSkeleton } from '@/shared/components/feedback/LoadingSkeleton';
import { PageContainer } from '@/shared/components/layout/PageContainer';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { useCan } from '@/shared/hooks/useCan';

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

export default function TeacherDetailPage() {
  const { id } = useParams<{ id: string }>();
  const teacherQuery = useTeacher(id ?? '');
  const canManage = useCan(['super_admin', 'admin']);

  if (teacherQuery.isLoading) {
    return (
      <PageContainer title="Teacher">
        <LoadingSkeleton lines={4} />
      </PageContainer>
    );
  }

  const teacher = teacherQuery.data;
  if (!teacher) {
    return (
      <PageContainer title="Teacher">
        <EmptyState title="Teacher not found" />
      </PageContainer>
    );
  }

  return (
    <PageContainer title={teacher.name} description={teacher.designation ?? undefined}>
      <Card>
        <CardHeader>
          <CardTitle>{ROLE_INFO_TITLE[teacher.role] ?? 'Staff info'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>
            <span className="text-muted-foreground">Email:</span> {teacher.email}
          </p>
          <p>
            <span className="text-muted-foreground">Role:</span>{' '}
            <span className="capitalize">{teacher.role}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Designation:</span>{' '}
            {teacher.designation ?? '—'}
          </p>
          <p className="flex items-center gap-2">
            <span className="text-muted-foreground">Employment status:</span>
            <Badge variant={STATUS_VARIANT[teacher.employment_status]} className="capitalize">
              {teacher.employment_status.replace('_', ' ')}
            </Badge>
          </p>
        </CardContent>
      </Card>

      <div className="mt-4">
        <StaffIdCardSection teacherId={teacher.uuid} canReissue={canManage} />
      </div>
    </PageContainer>
  );
}
