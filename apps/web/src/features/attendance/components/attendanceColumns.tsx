import type { ColumnDef } from '@tanstack/react-table';
import type { AttendanceRecord } from '../types';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';

const STATUS_VARIANT: Record<AttendanceRecord['status'], 'default' | 'secondary' | 'outline'> = {
  present: 'default',
  late: 'secondary',
  absent: 'outline',
  half_day: 'outline',
  out_without_in: 'outline',
};

interface BuildAttendanceColumnsOptions {
  canManage: boolean;
  onEdit: (record: AttendanceRecord) => void;
}

export function buildAttendanceColumns({
  canManage,
  onEdit,
}: BuildAttendanceColumnsOptions): ColumnDef<AttendanceRecord>[] {
  const columns: ColumnDef<AttendanceRecord>[] = [
    {
      id: 'name',
      header: 'Name',
      accessorFn: (row) => (row.student ? `${row.student.first_name} ${row.student.last_name}` : '—'),
    },
    {
      id: 'admission_no',
      header: 'Admission No.',
      accessorFn: (row) => row.student?.admission_no ?? '—',
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
      cell: ({ row }) => row.original.in_time ?? '—',
    },
    {
      accessorKey: 'out_time',
      header: 'Out',
      cell: ({ row }) => row.original.out_time ?? '—',
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
      cell: ({ row }) => <span className="capitalize">{row.original.source}</span>,
    },
  ];

  if (canManage) {
    columns.push({
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => onEdit(row.original)}>
            Edit
          </Button>
        </div>
      ),
    });
  }

  return columns;
}
