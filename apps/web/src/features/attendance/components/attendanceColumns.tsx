import type { ColumnDef } from '@tanstack/react-table';
import type { AttendanceRecord } from '../types';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { LICENSE_EXPIRED_MESSAGE } from '@/shared/hooks/useLicenseExpired';
import { formatBs } from '@/shared/lib/bikramSambat';
import { formatTime12h } from '@/shared/lib/time';

const STATUS_VARIANT: Record<AttendanceRecord['status'], 'default' | 'secondary' | 'outline'> = {
  present: 'default',
  late: 'secondary',
  absent: 'outline',
  half_day: 'outline',
  out_without_in: 'outline',
};

interface BuildAttendanceColumnsOptions {
  canManage: boolean;
  licenseExpired: boolean;
  onEdit: (record: AttendanceRecord) => void;
}

// Student-only (Prompt 34 Part B removed the Staff tab and the
// owner-type branch that used to build a Name/Designation pair here).
export function buildAttendanceColumns({
  canManage,
  licenseExpired,
  onEdit,
}: BuildAttendanceColumnsOptions): ColumnDef<AttendanceRecord>[] {
  const columns: ColumnDef<AttendanceRecord>[] = [
    {
      // date is already a plain "YYYY-MM-DD" string (AttendanceRecordResource),
      // which sorts correctly lexicographically as-is — no custom
      // sortingFn needed (unlike Roll No., which is text that needs
      // numeric parsing to sort correctly).
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }) => formatBs(row.original.date),
    },
    {
      id: 'name',
      header: 'Name',
      accessorFn: (row) => (row.student ? `${row.student.first_name} ${row.student.last_name}` : '—'),
    },
    {
      id: 'class',
      header: 'Class',
      enableSorting: false,
      accessorFn: (row) =>
        row.student?.school_class
          ? `${row.student.school_class.name}${row.student.school_class.section ? ` - ${row.student.school_class.section}` : ''}`
          : '—',
    },
    {
      accessorKey: 'in_time',
      header: 'In',
      cell: ({ row }) => (row.original.in_time ? formatTime12h(row.original.in_time) : '—'),
    },
    {
      accessorKey: 'out_time',
      header: 'Out',
      cell: ({ row }) => (row.original.out_time ? formatTime12h(row.original.out_time) : '—'),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={STATUS_VARIANT[row.original.status]} className="capitalize">
          {row.original.status.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      accessorKey: 'source',
      header: 'Source',
      cell: ({ row }) => <span className="capitalize">{row.original.source ?? '—'}</span>,
    },
  ];

  if (canManage) {
    columns.push({
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) =>
        // A synthesized absent row (source === null) has no real record
        // behind it — nothing to correct.
        row.original.source === null ? null : (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              disabled={licenseExpired}
              title={licenseExpired ? LICENSE_EXPIRED_MESSAGE : undefined}
              onClick={() => onEdit(row.original)}
            >
              Edit
            </Button>
          </div>
        ),
    });
  }

  return columns;
}
