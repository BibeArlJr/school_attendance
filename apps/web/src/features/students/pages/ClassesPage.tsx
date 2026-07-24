import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { classesApi } from '../api/studentsApi';
import { buildClassColumns } from '../components/classColumns';
import { ClassFormDialog } from '../components/ClassFormDialog';
import { useClasses } from '../hooks/useClasses';
import { useDeleteClass } from '../hooks/useDeleteClass';
import type { SchoolClass } from '../types';
import { DataTable } from '@/shared/components/data-table/DataTable';
import { DeleteConfirmDialog } from '@/shared/components/DeleteConfirmDialog';
import { Button } from '@/shared/components/ui/button';
import { useBulkDelete } from '@/shared/hooks/useBulkDelete';
import { useCan } from '@/shared/hooks/useCan';
import { extractErrorMessage } from '@/shared/lib/errors';

export default function ClassesPage() {
  const canManage = useCan(['super_admin', 'admin']);
  const classesQuery = useClasses();
  const [search, setSearch] = useState('');
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deletingClass, setDeletingClass] = useState<SchoolClass | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const deleteClass = useDeleteClass();
  const { bulkDelete } = useBulkDelete<SchoolClass>({
    queryKey: ['classes'],
    deleteFn: classesApi.delete,
    getLabel: (schoolClass) => schoolClass.name,
  });

  function handleDeleteOpenChange(nextOpen: boolean) {
    setDeleteDialogOpen(nextOpen);
    if (!nextOpen) {
      deleteClass.reset();
    }
  }

  const filteredClasses = useMemo(() => {
    const all = classesQuery.data ?? [];
    const query = search.trim().toLowerCase();
    if (!query) {
      return all;
    }
    return all.filter(
      (schoolClass) =>
        schoolClass.name.toLowerCase().includes(query) ||
        (schoolClass.section?.toLowerCase().includes(query) ?? false),
    );
  }, [classesQuery.data, search]);

  const columns = useMemo(
    () =>
      buildClassColumns({
        canManage,
        onEdit: (schoolClass) => {
          setEditingClass(schoolClass);
          setFormOpen(true);
        },
        onDeleteRequest: (schoolClass) => {
          setDeletingClass(schoolClass);
          setDeleteDialogOpen(true);
        },
      }),
    [canManage],
  );

  return (
    <div className="mt-4 space-y-4">
      <DataTable
        columns={columns}
        data={filteredClasses}
        isLoading={classesQuery.isLoading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name or section"
        pageIndex={0}
        pageCount={1}
        onPageChange={() => {
          /* no server-side pagination for classes — the whole list is small */
        }}
        totalCount={filteredClasses.length}
        emptyTitle="No classes yet"
        selection={
          canManage
            ? {
                onDeleteSelected: (rows) => bulkDelete(rows, (schoolClass) => schoolClass.uuid),
                entityLabelPlural: 'classes',
                // No fetchAllMatching — Classes has no server pagination at
                // all (useClasses() always fetches every row), so "select
                // all on page" already covers every matching row.
              }
            : undefined
        }
        actions={
          canManage ? (
            <Button
              onClick={() => {
                setEditingClass(null);
                setFormOpen(true);
              }}
            >
              <Plus className="size-4" />
              Add Class
            </Button>
          ) : undefined
        }
      />

      {canManage && (
        <ClassFormDialog open={formOpen} onOpenChange={setFormOpen} schoolClass={editingClass} />
      )}

      {canManage && (
        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={handleDeleteOpenChange}
          entityLabel="class"
          alternativeActionHint="A class that's ever actually had students stays permanently to protect historical reports — delete is only for classes created by mistake and never used."
          isPending={deleteClass.isPending}
          errorMessage={deleteClass.isError ? extractErrorMessage(deleteClass.error) : null}
          onConfirm={() => {
            if (!deletingClass) return;
            deleteClass.mutate(deletingClass.uuid, {
              onSuccess: () => setDeleteDialogOpen(false),
            });
          }}
        />
      )}
    </div>
  );
}
