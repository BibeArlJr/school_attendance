import type { ColumnDef } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import type { Staff } from '../types';
import { EmploymentStatusMenu } from './EmploymentStatusMenu';
import { staffDetailPath } from '@/app/router/routes';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { LICENSE_EXPIRED_MESSAGE } from '@/shared/hooks/useLicenseExpired';

const STATUS_VARIANT: Record<Staff['employment_status'], 'default' | 'secondary' | 'outline'> = {
  active: 'default',
  on_leave: 'secondary',
  resigned: 'outline',
};

const ROLE_LABEL: Record<Staff['role'], string> = {
  teacher: 'Teacher',
  guard: 'Guard',
  admin: 'Admin',
};

interface BuildStaffColumnsOptions {
  licenseExpired: boolean;
  onEdit: (staff: Staff) => void;
  onResetPassword: (staff: Staff) => void;
  onDeleteRequest: (staff: Staff) => void;
}

export function buildStaffColumns({
  licenseExpired,
  onEdit,
  onResetPassword,
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
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => <Badge variant="outline">{ROLE_LABEL[row.original.role]}</Badge>,
    },
    {
      accessorKey: 'designation',
      header: 'Designation',
      cell: ({ row }) => row.original.designation ?? '—',
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
          <Button
            variant="ghost"
            size="sm"
            disabled={licenseExpired}
            title={licenseExpired ? LICENSE_EXPIRED_MESSAGE : undefined}
            onClick={() => onResetPassword(row.original)}
          >
            Reset password
          </Button>
          <EmploymentStatusMenu
            staff={row.original}
            licenseExpired={licenseExpired}
            onDeleteRequest={onDeleteRequest}
          />
        </div>
      ),
    },
  ];
}
