import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnomalyReviewSection } from '../components/AnomalyReviewSection';
import { buildAttendanceColumns } from '../components/attendanceColumns';
import { ManualCorrectionDialog } from '../components/ManualCorrectionDialog';
import { useAttendanceRecords } from '../hooks/useAttendanceRecords';
import type { AttendanceRecord } from '../types';
import { useClasses } from '@/features/students/hooks/useClasses';
import { DataTable } from '@/shared/components/data-table/DataTable';
import { PageContainer } from '@/shared/components/layout/PageContainer';
import { Button } from '@/shared/components/ui/button';
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
  // Pre-filtered arrival from the dashboard's Present/Absent stat cards
  // (Prompt 18) — read once on mount, not kept in sync with the URL
  // afterward, since this page manages its own filter state locally like
  // every other list page in the app.
  const [searchParams] = useSearchParams();
  const [ownerType, setOwnerType] = useState<'student' | 'staff'>('student');
  const [date, setDate] = useState(searchParams.get('date') ?? today());
  const [classFilter, setClassFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') ?? 'all');
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

  function handleOwnerTypeChange(value: 'student' | 'staff') {
    setOwnerType(value);
    setClassFilter('all');
    setStatusFilter('all');
    setSearch('');
    setDebouncedSearch('');
    setPageIndex(0);
  }

  const recordsQuery = useAttendanceRecords({
    date,
    owner_type: ownerType,
    page: pageIndex + 1,
    per_page: PER_PAGE,
    class_id: ownerType === 'student' && classFilter !== 'all' ? Number(classFilter) : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    search: debouncedSearch || undefined,
  });

  const columns = useMemo(
    () =>
      buildAttendanceColumns({
        canManage,
        ownerType,
        onEdit: (record) => {
          setEditingRecord(record);
          setCorrectionOpen(true);
        },
      }),
    [canManage, ownerType],
  );

  return (
    <PageContainer title="Attendance" description="Daily attendance records from gate scans.">
      <div className="mb-4 flex gap-2">
        <Button
          variant={ownerType === 'student' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleOwnerTypeChange('student')}
        >
          Students
        </Button>
        <Button
          variant={ownerType === 'staff' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleOwnerTypeChange('staff')}
        >
          Staff
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={recordsQuery.data?.data ?? []}
        isLoading={recordsQuery.isLoading}
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPageIndex(0);
        }}
        searchPlaceholder={ownerType === 'student' ? 'Search by name' : 'Search by name or designation'}
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
            {ownerType === 'student' && (
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
            )}
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
