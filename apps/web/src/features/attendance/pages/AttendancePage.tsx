import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnomalyReviewSection } from '../components/AnomalyReviewSection';
import { buildAttendanceColumns } from '../components/attendanceColumns';
import { ManualCorrectionDialog } from '../components/ManualCorrectionDialog';
import { useAttendanceRecords } from '../hooks/useAttendanceRecords';
import type { AttendanceRecord } from '../types';
import { useClasses } from '@/features/students/hooks/useClasses';
import { BsDatePicker } from '@/shared/components/BsDatePicker';
import { DataTable } from '@/shared/components/data-table/DataTable';
import { PageContainer } from '@/shared/components/layout/PageContainer';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { useCan } from '@/shared/hooks/useCan';
import { useLicenseExpired } from '@/shared/hooks/useLicenseExpired';

const PER_PAGE = 15;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function AttendancePage() {
  const canManage = useCan(['super_admin', 'admin']);
  const licenseExpired = useLicenseExpired(canManage);
  // Pre-filtered arrival from the dashboard's Present/Absent stat cards
  // (Prompt 18) — read once on mount, not kept in sync with the URL
  // afterward, since this page manages its own filter state locally like
  // every other list page in the app.
  const [searchParams] = useSearchParams();
  const [date, setDate] = useState(searchParams.get('date') ?? today());
  const [classFilter, setClassFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') ?? 'all');
  // Separate from statusFilter deliberately — presence (in/out) is who's
  // currently on campus vs already left, orthogonal to the present/late/
  // absent/half_day daily classification (a late student who hasn't left
  // yet is both `late` and `in` at once, so merging this into one
  // dropdown would force a false either/or choice between two facts that
  // can both be true simultaneously).
  const [presenceFilter, setPresenceFilter] = useState('all');
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

  // Student-only (Prompt 34 Part B removed the Staff tab and staff
  // attendance tracking entirely) — 'student' is no longer a piece of
  // state, just a fixed value passed through to the query/columns.
  const recordsQuery = useAttendanceRecords({
    date,
    owner_type: 'student',
    page: pageIndex + 1,
    per_page: PER_PAGE,
    class_id: classFilter !== 'all' ? Number(classFilter) : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    presence: presenceFilter !== 'all' ? (presenceFilter as 'in' | 'out') : undefined,
    search: debouncedSearch || undefined,
  });

  const columns = useMemo(
    () =>
      buildAttendanceColumns({
        canManage,
        licenseExpired,
        onEdit: (record) => {
          setEditingRecord(record);
          setCorrectionOpen(true);
        },
      }),
    [canManage, licenseExpired],
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
        searchPlaceholder="Search by name"
        pageIndex={pageIndex}
        pageCount={recordsQuery.data?.last_page ?? 1}
        onPageChange={setPageIndex}
        totalCount={recordsQuery.data?.total}
        emptyTitle="No attendance records for this date"
        filters={
          <>
            <div className="w-44">
              <BsDatePicker
                value={date}
                onChange={(value) => {
                  setDate(value);
                  setPageIndex(0);
                }}
                hideAdHint
              />
            </div>
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
            <Select
              value={presenceFilter}
              onValueChange={(value) => {
                setPresenceFilter(value);
                setPageIndex(0);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Currently" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">In or out</SelectItem>
                <SelectItem value="in">In (on campus)</SelectItem>
                <SelectItem value="out">Out (left)</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
      />

      {canManage && (
        <div className="mt-6">
          <AnomalyReviewSection licenseExpired={licenseExpired} />
        </div>
      )}

      <ManualCorrectionDialog
        open={correctionOpen}
        onOpenChange={setCorrectionOpen}
        record={editingRecord}
        licenseExpired={licenseExpired}
      />
    </PageContainer>
  );
}
