import type { ColumnDef } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import type { ParentGuardian } from '../types';
import { parentDetailPath } from '@/app/router/routes';
import { Button } from '@/shared/components/ui/button';

interface BuildParentColumnsOptions {
  onEdit: (parent: ParentGuardian) => void;
}

export function buildParentColumns({ onEdit }: BuildParentColumnsOptions): ColumnDef<ParentGuardian>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <Link to={parentDetailPath(row.original.id)} className="font-medium hover:underline">
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => row.original.email ?? '—',
    },
    {
      id: 'linked_students_count',
      header: 'Children',
      enableSorting: false,
      cell: ({ row }) => row.original.linked_students_count ?? 0,
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => onEdit(row.original)}>
            Edit
          </Button>
        </div>
      ),
    },
  ];
}
