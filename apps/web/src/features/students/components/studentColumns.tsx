import type { ColumnDef } from '@tanstack/react-table';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { formatDob } from '../lib/formatDob';
import type { Student } from '../types';
import { studentDetailPath } from '@/app/router/routes';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';

const STATUS_VARIANT: Record<Student['status'], 'default' | 'secondary' | 'outline'> = {
  active: 'default',
  inactive: 'secondary',
  transferred: 'outline',
  alumni: 'outline',
};

interface BuildStudentColumnsOptions {
  canManage: boolean;
  onEdit: (student: Student) => void;
  renderStatusMenu: (student: Student) => ReactNode;
}

export function buildStudentColumns({
  canManage,
  onEdit,
  renderStatusMenu,
}: BuildStudentColumnsOptions): ColumnDef<Student>[] {
  const columns: ColumnDef<Student>[] = [
    {
      id: 'name',
      header: 'Name',
      accessorFn: (row) => `${row.first_name} ${row.last_name}`,
      cell: ({ row }) => (
        <Link to={studentDetailPath(row.original.uuid)} className="font-medium hover:underline">
          {row.original.first_name} {row.original.last_name}
        </Link>
      ),
    },
    {
      id: 'barcode',
      header: 'Barcode',
      enableSorting: false,
      accessorFn: (row) => row.barcode_value ?? '—',
    },
    {
      id: 'roll_no',
      header: 'Roll No.',
      accessorFn: (row) => row.current_enrollment?.roll_no ?? null,
      cell: ({ row }) => row.original.current_enrollment?.roll_no ?? '—',
      // roll_no is stored as text, so default sorting would compare it as
      // a string ("10" before "2") — parse both sides to numbers instead.
      // Rows without a roll number sort to the end regardless of value.
      sortingFn: (rowA, rowB) => {
        const rawA = rowA.original.current_enrollment?.roll_no;
        const rawB = rowB.original.current_enrollment?.roll_no;
        const numA = rawA !== null && rawA !== undefined && rawA !== '' ? Number(rawA) : null;
        const numB = rawB !== null && rawB !== undefined && rawB !== '' ? Number(rawB) : null;
        if (numA === null && numB === null) return 0;
        if (numA === null) return 1;
        if (numB === null) return -1;
        return numA - numB;
      },
    },
    {
      id: 'class',
      header: 'Class',
      enableSorting: false,
      accessorFn: (row) =>
        row.school_class
          ? `${row.school_class.name}${row.school_class.section ? ` - ${row.school_class.section}` : ''}`
          : '—',
    },
    {
      id: 'dob',
      header: 'DOB',
      enableSorting: false,
      accessorFn: (row) => formatDob(row),
    },
    {
      id: 'address',
      header: 'Address',
      enableSorting: false,
      cell: ({ row }) => (
        <span
          className="block max-w-40 truncate"
          title={row.original.address ?? undefined}
        >
          {row.original.address ?? '—'}
        </span>
      ),
    },
    {
      id: 'guardian',
      header: 'Guardian',
      enableSorting: false,
      cell: ({ row }) => {
        const guardian = row.original.primary_parent_link?.parent_guardian;
        if (!guardian) {
          return <span className="text-muted-foreground">—</span>;
        }
        return (
          <div>
            <div>{guardian.name}</div>
            <div className="text-xs text-muted-foreground">{guardian.phone}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={STATUS_VARIANT[row.original.status]} className="capitalize">
          {row.original.status}
        </Badge>
      ),
    },
  ];

  // Not just CSS-hidden — the column (and its Edit/status controls) is
  // never added to the table definition at all for roles that can't
  // write, matching useCan's contract.
  if (canManage) {
    columns.push({
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => onEdit(row.original)}>
            Edit
          </Button>
          {renderStatusMenu(row.original)}
        </div>
      ),
    });
  }

  return columns;
}
