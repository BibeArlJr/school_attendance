import { useParams } from 'react-router-dom';
import { useStudent } from '../hooks/useStudent';
import { formatDob } from '../lib/formatDob';
import { AttendanceHistorySection } from '@/features/attendance/components/AttendanceHistorySection';
import { IdCardSection } from '@/features/idcards/components/IdCardSection';
import { GuardiansSection } from '@/features/parents/components/GuardiansSection';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { LoadingSkeleton } from '@/shared/components/feedback/LoadingSkeleton';
import { PageContainer } from '@/shared/components/layout/PageContainer';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { useCan } from '@/shared/hooks/useCan';

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  active: 'default',
  inactive: 'secondary',
  transferred: 'outline',
  alumni: 'outline',
};

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const studentQuery = useStudent(id ?? '');
  // Guardian contact info is Parents-module data (access-parents), not
  // Students data — Phase 3's matrix gives Parents no teacher read-tier,
  // unlike Students, so this section (and its underlying query) must never
  // render for a role that only has access-students.
  const canViewGuardians = useCan(['super_admin', 'admin']);

  if (studentQuery.isLoading) {
    return (
      <PageContainer title="Student">
        <LoadingSkeleton lines={4} />
      </PageContainer>
    );
  }

  const student = studentQuery.data;
  if (!student) {
    return (
      <PageContainer title="Student">
        <EmptyState title="Student not found" />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={`${student.first_name} ${student.last_name}`}
      description={
        student.school_class
          ? `${student.school_class.name}${student.school_class.section ? ` - ${student.school_class.section}` : ''}`
          : undefined
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Student info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>
            <span className="text-muted-foreground">Class:</span>{' '}
            {student.school_class
              ? `${student.school_class.name}${student.school_class.section ? ` - ${student.school_class.section}` : ''}`
              : '—'}
          </p>
          <p>
            <span className="text-muted-foreground">Date of birth:</span> {formatDob(student)}
          </p>
          <p>
            <span className="text-muted-foreground">Gender:</span>{' '}
            <span className="capitalize">{student.gender ?? '—'}</span>
          </p>
          <p className="flex items-center gap-2">
            <span className="text-muted-foreground">Status:</span>
            <Badge variant={STATUS_VARIANT[student.status]} className="capitalize">
              {student.status}
            </Badge>
          </p>
        </CardContent>
      </Card>

      <div className="mt-4">
        <IdCardSection studentId={student.uuid} />
      </div>

      <div className="mt-4">
        <AttendanceHistorySection studentUuid={student.uuid} />
      </div>

      {canViewGuardians && (
        <div className="mt-4">
          <GuardiansSection studentId={student.uuid} />
        </div>
      )}
    </PageContainer>
  );
}
