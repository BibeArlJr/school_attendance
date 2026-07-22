import type { ColumnDef } from '@tanstack/react-table';
import { UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { IdCard } from '../types';
import { studentIdCardPath } from '@/app/router/routes';
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';

const STATUS_VARIANT: Record<IdCard['status'], 'default' | 'secondary' | 'outline'> = {
  active: 'default',
  lost: 'outline',
  deactivated: 'secondary',
};

export function buildIdCardColumns(): ColumnDef<IdCard>[] {
  return [
    {
      id: 'photo',
      header: '',
      enableSorting: false,
      cell: () => (
        <Avatar>
          <AvatarFallback>
            <UserRound className="size-4" />
          </AvatarFallback>
        </Avatar>
      ),
    },
    {
      id: 'name',
      header: 'Name',
      accessorFn: (row) => `${row.student.first_name} ${row.student.last_name}`,
      cell: ({ row }) => (
        <Link to={studentIdCardPath(row.original.student.id)} className="font-medium hover:underline">
          {row.original.student.first_name} {row.original.student.last_name}
        </Link>
      ),
    },
    {
      id: 'class',
      header: 'Class',
      enableSorting: false,
      accessorFn: (row) =>
        row.student.school_class
          ? `${row.student.school_class.name}${row.student.school_class.section ? ` - ${row.student.school_class.section}` : ''}`
          : '—',
    },
    {
      id: 'admission_no',
      header: 'Admission No.',
      accessorFn: (row) => row.student.admission_no,
    },
    {
      accessorKey: 'barcode_value',
      header: 'Barcode',
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
}
