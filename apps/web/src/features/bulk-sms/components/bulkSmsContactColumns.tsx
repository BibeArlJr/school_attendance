import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Trash2 } from 'lucide-react';
import type { BulkSmsContact } from '../types';
import { Button } from '@/shared/components/ui/button';

interface BuildBulkSmsContactColumnsOptions {
  onEdit: (contact: BulkSmsContact) => void;
  onDeleteRequest: (contact: BulkSmsContact) => void;
}

export function buildBulkSmsContactColumns({
  onEdit,
  onDeleteRequest,
}: BuildBulkSmsContactColumnsOptions): ColumnDef<BulkSmsContact>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => row.original.name ?? '—',
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon-sm" aria-label="Edit contact" onClick={() => onEdit(row.original)}>
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Delete contact"
            onClick={() => onDeleteRequest(row.original)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];
}
