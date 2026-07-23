import { Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { PasswordRevealDialog } from '../components/PasswordRevealDialog';
import { buildTeacherColumns } from '../components/teacherColumns';
import { TeacherFormDialog } from '../components/TeacherFormDialog';
import { useDeleteTeacher } from '../hooks/useDeleteTeacher';
import { useResetPassword } from '../hooks/useResetPassword';
import { useTeachers } from '../hooks/useTeachers';
import type { Teacher } from '../types';
import { DataTable } from '@/shared/components/data-table/DataTable';
import { DeleteConfirmDialog } from '@/shared/components/DeleteConfirmDialog';
import { Button } from '@/shared/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { useCan } from '@/shared/hooks/useCan';
import { extractErrorMessage } from '@/shared/lib/errors';

const PER_PAGE = 10;

export default function TeachersPage() {
  const canManage = useCan(['super_admin', 'admin']);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pageIndex, setPageIndex] = useState(0);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [revealPassword, setRevealPassword] = useState<string | null>(null);
  const [deletingTeacher, setDeletingTeacher] = useState<Teacher | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const resetPassword = useResetPassword();
  const deleteTeacher = useDeleteTeacher();

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(id);
  }, [search]);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPageIndex(0);
  }

  function handleStatusFilterChange(value: string) {
    setStatusFilter(value);
    setPageIndex(0);
  }

  const teachersQuery = useTeachers({
    page: pageIndex + 1,
    per_page: PER_PAGE,
    search: debouncedSearch || undefined,
    employment_status: statusFilter !== 'all' ? statusFilter : undefined,
  });

  const columns = useMemo(
    () =>
      buildTeacherColumns({
        onEdit: (teacher) => {
          setEditingTeacher(teacher);
          setFormOpen(true);
        },
        onResetPassword: (teacher) =>
          resetPassword.mutate(teacher.id, {
            onSuccess: (temporaryPassword) => setRevealPassword(temporaryPassword),
          }),
        onDeleteRequest: (teacher) => {
          setDeletingTeacher(teacher);
          setDeleteDialogOpen(true);
        },
      }),
    [resetPassword],
  );

  function handleDeleteOpenChange(nextOpen: boolean) {
    setDeleteDialogOpen(nextOpen);
    if (!nextOpen) {
      deleteTeacher.reset();
    }
  }

  return (
    <div className="mt-4">
      <DataTable
        columns={columns}
        data={teachersQuery.data?.data ?? []}
        isLoading={teachersQuery.isLoading}
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search by name or email"
        pageIndex={pageIndex}
        pageCount={teachersQuery.data?.last_page ?? 1}
        onPageChange={setPageIndex}
        totalCount={teachersQuery.data?.total}
        emptyTitle="No teachers found"
        filters={
          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="on_leave">On Leave</SelectItem>
              <SelectItem value="resigned">Resigned</SelectItem>
            </SelectContent>
          </Select>
        }
        actions={
          canManage ? (
            <Button
              onClick={() => {
                setEditingTeacher(null);
                setFormOpen(true);
              }}
            >
              <Plus className="size-4" />
              Add Teacher
            </Button>
          ) : undefined
        }
      />

      {canManage && (
        <TeacherFormDialog open={formOpen} onOpenChange={setFormOpen} teacher={editingTeacher} />
      )}

      <PasswordRevealDialog
        open={revealPassword !== null}
        onOpenChange={(nextOpen) => !nextOpen && setRevealPassword(null)}
        password={revealPassword}
        title="Password reset"
      />

      {canManage && (
        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={handleDeleteOpenChange}
          entityLabel="teacher"
          alternativeActionHint="If this teacher actually left the school, use the employment status menu instead — delete is only for records added by mistake."
          isPending={deleteTeacher.isPending}
          errorMessage={deleteTeacher.isError ? extractErrorMessage(deleteTeacher.error) : null}
          onConfirm={() => {
            if (!deletingTeacher) return;
            deleteTeacher.mutate(deletingTeacher.id, {
              onSuccess: () => setDeleteDialogOpen(false),
            });
          }}
        />
      )}
    </div>
  );
}
