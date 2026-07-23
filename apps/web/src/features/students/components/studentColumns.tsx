import type { ColumnDef } from '@tanstack/react-table';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
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
        <Link to={studentDetailPath(row.original.id)} className="font-medium hover:underline">
          {row.original.first_name} {row.original.last_name}
        </Link>
      ),
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
