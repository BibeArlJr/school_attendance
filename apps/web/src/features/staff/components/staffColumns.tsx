import type { ColumnDef } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import type { Staff } from '../types';
import { StaffEmploymentStatusMenu } from './StaffEmploymentStatusMenu';
import { staffDetailPath } from '@/app/router/routes';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { LICENSE_EXPIRED_MESSAGE } from '@/shared/hooks/useLicenseExpired';

const STATUS_VARIANT: Record<Staff['employment_status'], 'default' | 'secondary' | 'outline'> = {
  active: 'default',
  on_leave: 'secondary',
  resigned: 'outline',
};

interface BuildStaffColumnsOptions {
  licenseExpired: boolean;
  onEdit: (staff: Staff) => void;
  onDeleteRequest: (staff: Staff) => void;
}

export function buildStaffColumns({
  licenseExpired,
  onEdit,
  onDeleteRequest,
}: BuildStaffColumnsOptions): ColumnDef<Staff>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <Link to={staffDetailPath(row.original.uuid)} className="font-medium hover:underline">
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: 'designation',
      header: 'Designation',
      cell: ({ row }) => row.original.designation ?? '—',
    },
    {
      accessorKey: 'rank',
      header: 'Rank',
      enableSorting: false,
      cell: ({ row }) => row.original.rank ?? '—',
    },
    {
      accessorKey: 'level',
      header: 'Level',
      enableSorting: false,
      cell: ({ row }) => row.original.level ?? '—',
    },
    {
      accessorKey: 'mobile',
      header: 'Mobile',
      enableSorting: false,
      cell: ({ row }) => row.original.mobile ?? '—',
    },
    {
      accessorKey: 'employment_status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={STATUS_VARIANT[row.original.employment_status]} className="capitalize">
          {row.original.employment_status.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            disabled={licenseExpired}
            title={licenseExpired ? LICENSE_EXPIRED_MESSAGE : undefined}
            onClick={() => onEdit(row.original)}
          >
            Edit
          </Button>
          <StaffEmploymentStatusMenu
            staff={row.original}
            licenseExpired={licenseExpired}
            onDeleteRequest={onDeleteRequest}
          />
        </div>
      ),
    },
  ];
}
