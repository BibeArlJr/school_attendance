import { Plus, Upload } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { studentsApi } from '../api/studentsApi';
import { buildStudentColumns } from '../components/studentColumns';
import { StudentFormDialog } from '../components/StudentFormDialog';
import { StudentStatusMenu } from '../components/StudentStatusMenu';
import { useClasses } from '../hooks/useClasses';
import { useDeleteStudent } from '../hooks/useDeleteStudent';
import { useStudents } from '../hooks/useStudents';
import type { Student } from '../types';
import { ROUTES } from '@/app/router/routes';
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
import { useBulkDelete } from '@/shared/hooks/useBulkDelete';
import { useCan } from '@/shared/hooks/useCan';
import { extractErrorMessage } from '@/shared/lib/errors';

const PER_PAGE = 10;

export default function StudentsPage() {
  const canManage = useCan(['super_admin', 'admin']);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pageIndex, setPageIndex] = useState(0);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const deleteStudent = useDeleteStudent();
  const { bulkDelete } = useBulkDelete<Student>({
    queryKey: ['students'],
    deleteFn: studentsApi.delete,
    getLabel: (student) => `${student.first_name} ${student.last_name}`,
  });

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(id);
  }, [search]);

  // Page resets to 0 directly in each filter's change handler below
  // (not via a separate effect watching the filter values) — resetting
  // synchronously inside an effect body causes an extra render pass for
  // no benefit here.
  function handleSearchChange(value: string) {
    setSearch(value);
    setPageIndex(0);
  }

  function handleClassFilterChange(value: string) {
    setClassFilter(value);
    setPageIndex(0);
  }

  function handleStatusFilterChange(value: string) {
    setStatusFilter(value);
    setPageIndex(0);
  }

  const classesQuery = useClasses();

  const studentsQuery = useStudents({
    page: pageIndex + 1,
    per_page: PER_PAGE,
    search: debouncedSearch || undefined,
    class_id: classFilter !== 'all' ? Number(classFilter) : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });

  const columns = useMemo(
    () =>
      buildStudentColumns({
        canManage,
        onEdit: (student) => {
          setEditingStudent(student);
          setFormOpen(true);
        },
        renderStatusMenu: (student) => (
          <StudentStatusMenu
            student={student}
            onDeleteRequest={(target) => {
              setDeletingStudent(target);
              setDeleteDialogOpen(true);
            }}
          />
        ),
      }),
    [canManage],
  );

  function handleDeleteOpenChange(nextOpen: boolean) {
    setDeleteDialogOpen(nextOpen);
    if (!nextOpen) {
      deleteStudent.reset();
    }
  }

  return (
    <div className="mt-4">
      <DataTable
        columns={columns}
        data={studentsQuery.data?.data ?? []}
        isLoading={studentsQuery.isLoading}
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search by name or barcode"
        pageIndex={pageIndex}
        pageCount={studentsQuery.data?.last_page ?? 1}
        onPageChange={setPageIndex}
        totalCount={studentsQuery.data?.total}
        emptyTitle="No students found"
        selection={
          canManage
            ? {
                onDeleteSelected: (rows) => bulkDelete(rows, (student) => student.uuid),
                entityLabelPlural: 'students',
                fetchAllMatching: async () => {
                  const total = studentsQuery.data?.total ?? 0;
                  if (total === 0) {
                    return [];
                  }
                  const result = await studentsApi.list({
                    per_page: total,
                    search: debouncedSearch || undefined,
                    class_id: classFilter !== 'all' ? Number(classFilter) : undefined,
                    status: statusFilter !== 'all' ? statusFilter : undefined,
                  });
                  return result.data;
                },
              }
            : undefined
        }
        filters={
          <>
            <Select value={classFilter} onValueChange={handleClassFilterChange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All classes</SelectItem>
                {classesQuery.data?.map((schoolClass) => (
                  <SelectItem key={schoolClass.id} value={String(schoolClass.id)}>
                    {schoolClass.name}
                    {schoolClass.section ? ` - ${schoolClass.section}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="transferred">Transferred</SelectItem>
                <SelectItem value="alumni">Alumni</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
        actions={
          canManage ? (
            <>
              <Button variant="outline" asChild>
                <Link to={ROUTES.STUDENTS_IMPORT}>
                  <Upload className="size-4" />
                  Import Students
                </Link>
              </Button>
              <Button
                onClick={() => {
                  setEditingStudent(null);
                  setFormOpen(true);
                }}
              >
                <Plus className="size-4" />
                Add Student
              </Button>
            </>
          ) : undefined
        }
      />

      {canManage && (
        <StudentFormDialog open={formOpen} onOpenChange={setFormOpen} student={editingStudent} />
      )}

      {canManage && (
        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={handleDeleteOpenChange}
          entityLabel="student"
          alternativeActionHint="If this student actually left the school, use the status menu instead — delete is only for records added by mistake."
          isPending={deleteStudent.isPending}
          errorMessage={deleteStudent.isError ? extractErrorMessage(deleteStudent.error) : null}
          onConfirm={() => {
            if (!deletingStudent) return;
            deleteStudent.mutate(deletingStudent.uuid, {
              onSuccess: () => setDeleteDialogOpen(false),
            });
          }}
        />
      )}
    </div>
  );
}
