import type { ColumnDef } from '@tanstack/react-table';
import { Trash2 } from 'lucide-react';
import type { SchoolClass } from '../types';
import { Button } from '@/shared/components/ui/button';

interface BuildClassColumnsOptions {
  canManage: boolean;
  onEdit: (schoolClass: SchoolClass) => void;
  onDeleteRequest: (schoolClass: SchoolClass) => void;
}

export function buildClassColumns({
  canManage,
  onEdit,
  onDeleteRequest,
}: BuildClassColumnsOptions): ColumnDef<SchoolClass>[] {
  const columns: ColumnDef<SchoolClass>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      id: 'section',
      header: 'Section',
      enableSorting: false,
      accessorFn: (row) => row.section ?? '—',
    },
    {
      id: 'class_teacher',
      header: 'Class Teacher',
      enableSorting: false,
      accessorFn: (row) => row.class_teacher?.name ?? '—',
    },
  ];

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
    });
  }

  return columns;
}
