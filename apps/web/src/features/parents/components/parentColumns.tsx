import type { ColumnDef } from '@tanstack/react-table';
import { Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ParentGuardian } from '../types';
import { parentDetailPath } from '@/app/router/routes';
import { Button } from '@/shared/components/ui/button';

interface BuildParentColumnsOptions {
  onEdit: (parent: ParentGuardian) => void;
  onDeleteRequest: (parent: ParentGuardian) => void;
}

export function buildParentColumns({
  onEdit,
  onDeleteRequest,
}: BuildParentColumnsOptions): ColumnDef<ParentGuardian>[] {
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
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-destructive hover:text-destructive"
            aria-label={`Delete ${row.original.name}`}
            onClick={() => onDeleteRequest(row.original)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];
}
