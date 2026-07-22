import { Plus } from 'lucide-react';
import { useState } from 'react';
import { ClassFormDialog } from '../components/ClassFormDialog';
import { useClasses } from '../hooks/useClasses';
import type { SchoolClass } from '../types';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { LoadingSkeleton } from '@/shared/components/feedback/LoadingSkeleton';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { useCan } from '@/shared/hooks/useCan';

export default function ClassesPage() {
  const canManage = useCan(['super_admin', 'admin']);
  const classesQuery = useClasses();
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div className="mt-4 space-y-4">
      <div className="flex justify-end">
        {canManage && (
          <Button
            onClick={() => {
              setEditingClass(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" />
            Add Class
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          {classesQuery.isLoading ? (
            <LoadingSkeleton lines={4} />
          ) : classesQuery.isError ? (
            <ErrorState onRetry={() => classesQuery.refetch()} />
          ) : classesQuery.data && classesQuery.data.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Class Teacher</TableHead>
                  {canManage && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {classesQuery.data.map((schoolClass) => (
                  <TableRow key={schoolClass.id}>
                    <TableCell>{schoolClass.name}</TableCell>
                    <TableCell>{schoolClass.section ?? '—'}</TableCell>
                    <TableCell>{schoolClass.class_teacher?.name ?? '—'}</TableCell>
                    {canManage && (
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingClass(schoolClass);
                            setFormOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState title="No classes yet" />
          )}
        </CardContent>
      </Card>

      {canManage && (
        <ClassFormDialog open={formOpen} onOpenChange={setFormOpen} schoolClass={editingClass} />
      )}
    </div>
  );
}
