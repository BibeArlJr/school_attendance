import { useEffect, useMemo, useState } from 'react';
import { AnomalyReviewSection } from '../components/AnomalyReviewSection';
import { buildAttendanceColumns } from '../components/attendanceColumns';
import { ManualCorrectionDialog } from '../components/ManualCorrectionDialog';
import { useAttendanceRecords } from '../hooks/useAttendanceRecords';
import type { AttendanceRecord } from '../types';
import { useClasses } from '@/features/students/hooks/useClasses';
import { DataTable } from '@/shared/components/data-table/DataTable';
import { PageContainer } from '@/shared/components/layout/PageContainer';
import { Input } from '@/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { useCan } from '@/shared/hooks/useCan';

const PER_PAGE = 15;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function AttendancePage() {
  const canManage = useCan(['super_admin', 'admin']);
  const [date, setDate] = useState(today());
  const [classFilter, setClassFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(id);
  }, [search]);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [correctionOpen, setCorrectionOpen] = useState(false);

  const classesQuery = useClasses();

  const recordsQuery = useAttendanceRecords({
    date,
    page: pageIndex + 1,
    per_page: PER_PAGE,
    class_id: classFilter !== 'all' ? Number(classFilter) : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    search: debouncedSearch || undefined,
  });

  const columns = useMemo(
    () =>
      buildAttendanceColumns({
        canManage,
        onEdit: (record) => {
          setEditingRecord(record);
          setCorrectionOpen(true);
        },
      }),
    [canManage],
  );

  return (
    <PageContainer title="Attendance" description="Daily attendance records from gate scans.">
      <DataTable
        columns={columns}
        data={recordsQuery.data?.data ?? []}
        isLoading={recordsQuery.isLoading}
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPageIndex(0);
        }}
        searchPlaceholder="Search by name or admission no."
        pageIndex={pageIndex}
        pageCount={recordsQuery.data?.last_page ?? 1}
        onPageChange={setPageIndex}
        totalCount={recordsQuery.data?.total}
        emptyTitle="No attendance records for this date"
        filters={
          <>
            <Input
              type="date"
              value={date}
              onChange={(event) => {
                setDate(event.target.value);
                setPageIndex(0);
              }}
              className="w-40"
            />
            <Select
              value={classFilter}
              onValueChange={(value) => {
                setClassFilter(value);
                setPageIndex(0);
              }}
            >
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
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPageIndex(0);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="half_day">Half day</SelectItem>
                <SelectItem value="out_without_in">Out without in</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
      />

      {canManage && (
        <div className="mt-6">
          <AnomalyReviewSection />
        </div>
      )}

      <ManualCorrectionDialog
        open={correctionOpen}
        onOpenChange={setCorrectionOpen}
        record={editingRecord}
      />
    </PageContainer>
  );
}
