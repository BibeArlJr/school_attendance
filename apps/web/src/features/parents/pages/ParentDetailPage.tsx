import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ParentFormDialog } from '../components/ParentFormDialog';
import { useParent } from '../hooks/useParent';
import { studentDetailPath } from '@/app/router/routes';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { LoadingSkeleton } from '@/shared/components/feedback/LoadingSkeleton';
import { PageContainer } from '@/shared/components/layout/PageContainer';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { LICENSE_EXPIRED_MESSAGE, useLicenseExpired } from '@/shared/hooks/useLicenseExpired';

const RELATION_LABEL: Record<string, string> = {
  father: 'Father',
  mother: 'Mother',
  guardian: 'Guardian',
  other: 'Other',
};

export default function ParentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const parentQuery = useParent(id ?? '');
  const [editOpen, setEditOpen] = useState(false);
  // No useCan guard on this page — access-parents is already
  // admin/super_admin-only at the route level (see ParentsPage.tsx).
  const licenseExpired = useLicenseExpired();

  if (parentQuery.isLoading) {
    return (
      <PageContainer title="Parent">
        <LoadingSkeleton lines={4} />
      </PageContainer>
    );
  }

  const parent = parentQuery.data;
  if (!parent) {
    return (
      <PageContainer title="Parent">
        <EmptyState title="Parent not found" />
      </PageContainer>
    );
  }

  return (
    <PageContainer title={parent.name} description="Parent/guardian contact details.">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Contact info</CardTitle>
          <Button
            size="sm"
            variant="outline"
            disabled={licenseExpired}
            title={licenseExpired ? LICENSE_EXPIRED_MESSAGE : undefined}
            onClick={() => setEditOpen(true)}
          >
            Edit
          </Button>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>
            <span className="text-muted-foreground">Phone:</span> {parent.phone}
          </p>
          <p>
            <span className="text-muted-foreground">Email:</span> {parent.email ?? '—'}
          </p>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Linked students</CardTitle>
        </CardHeader>
        <CardContent>
          {!parent.linked_students || parent.linked_students.length === 0 ? (
            <EmptyState title="No students linked yet" />
          ) : (
            <ul className="divide-y">
              {parent.linked_students.map((link) => (
                <li key={link.link_id} className="flex items-center justify-between py-3">
                  <div>
                    <Link
                      to={studentDetailPath(link.student.uuid)}
                      className="font-medium hover:underline"
                    >
                      {link.student.first_name} {link.student.last_name}
                    </Link>
                    {link.student.school_class && (
                      <p className="text-sm text-muted-foreground">
                        {link.student.school_class.name}
                        {link.student.school_class.section ? ` - ${link.student.school_class.section}` : ''}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {RELATION_LABEL[link.relation]}
                    </Badge>
                    {link.is_primary_contact && <Badge>Primary contact</Badge>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <ParentFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        parent={parent}
        licenseExpired={licenseExpired}
      />
    </PageContainer>
  );
}
