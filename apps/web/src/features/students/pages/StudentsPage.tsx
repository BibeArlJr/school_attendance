import { Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { buildStudentColumns } from '../components/studentColumns';
import { StudentFormDialog } from '../components/StudentFormDialog';
import { StudentStatusMenu } from '../components/StudentStatusMenu';
import { useClasses } from '../hooks/useClasses';
import { useStudents } from '../hooks/useStudents';
import type { Student } from '../types';
import { DataTable } from '@/shared/components/data-table/DataTable';
import { Button } from '@/shared/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { useCan } from '@/shared/hooks/useCan';

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
        renderStatusMenu: (student) => <StudentStatusMenu student={student} />,
      }),
    [canManage],
  );

  return (
    <div className="mt-4">
      <DataTable
        columns={columns}
        data={studentsQuery.data?.data ?? []}
        isLoading={studentsQuery.isLoading}
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search by name or admission no."
        pageIndex={pageIndex}
        pageCount={studentsQuery.data?.last_page ?? 1}
        onPageChange={setPageIndex}
        totalCount={studentsQuery.data?.total}
        emptyTitle="No students found"
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
            <Button
              onClick={() => {
                setEditingStudent(null);
                setFormOpen(true);
              }}
            >
              <Plus className="size-4" />
              Add Student
            </Button>
          ) : undefined
        }
      />

      {canManage && (
        <StudentFormDialog open={formOpen} onOpenChange={setFormOpen} student={editingStudent} />
      )}
    </div>
  );
}
