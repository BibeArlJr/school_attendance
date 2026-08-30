import type { ColumnDef } from '@tanstack/react-table';
import { UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { IdCard, IdCardOwnerType } from '../types';
import { BarcodeImage } from './BarcodeImage';
import { staffDetailPath, studentIdCardPath } from '@/app/router/routes';
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';

const STATUS_VARIANT: Record<IdCard['status'], 'default' | 'secondary' | 'outline'> = {
  active: 'default',
  lost: 'outline',
  deactivated: 'secondary',
};

// The caller always passes a single, fixed owner_type through to GET
// /id-cards (restored, Rebuild Staff Module Part D.6) — student and
// staff rows are never mixed in the same page, so each branch below can
// safely assert its own half of the union non-null.
export function buildIdCardColumns(ownerType: IdCardOwnerType): ColumnDef<IdCard>[] {
  if (ownerType === 'staff') {
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
        accessorFn: (row) => row.staff!.name,
        cell: ({ row }) => (
          <Link to={staffDetailPath(row.original.staff!.uuid)} className="font-medium hover:underline">
            {row.original.staff!.name}
          </Link>
        ),
      },
      {
        id: 'designation',
        header: 'Designation',
        enableSorting: false,
        accessorFn: (row) => row.staff!.designation ?? '—',
      },
      {
        accessorKey: 'barcode_value',
        header: 'QR Code',
        cell: ({ row }) => (
          <div className="inline-block rounded bg-white p-1">
            <BarcodeImage value={row.original.barcode_value} size={48} />
          </div>
        ),
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
      accessorFn: (row) => `${row.student!.first_name} ${row.student!.last_name}`,
      cell: ({ row }) => (
        <Link to={studentIdCardPath(row.original.student!.uuid)} className="font-medium hover:underline">
          {row.original.student!.first_name} {row.original.student!.last_name}
        </Link>
      ),
    },
    {
      id: 'class',
      header: 'Class',
      enableSorting: false,
      accessorFn: (row) =>
        row.student!.school_class
          ? `${row.student!.school_class.name}${row.student!.school_class.section ? ` - ${row.student!.school_class.section}` : ''}`
          : '—',
    },
    {
      id: 'roll_no',
      header: 'Roll No',
      enableSorting: false,
      accessorFn: (row) => row.student!.roll_no ?? '—',
    },
    {
      accessorKey: 'barcode_value',
      header: 'QR Code',
      cell: ({ row }) => (
        // Fixed white background regardless of theme — same reasoning as
        // IdCardView: a QR code needs a light background + dark modules
        // to stay scannable, in dark mode and on paper alike.
        <div className="inline-block rounded bg-white p-1">
          <BarcodeImage value={row.original.barcode_value} size={48} />
        </div>
      ),
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
