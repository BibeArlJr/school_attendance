import type { ColumnDef } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import type { UserAccount } from '../types';
import { EmploymentStatusMenu } from './EmploymentStatusMenu';
import { userDetailPath } from '@/app/router/routes';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { LICENSE_EXPIRED_MESSAGE } from '@/shared/hooks/useLicenseExpired';

const STATUS_VARIANT: Record<UserAccount['employment_status'], 'default' | 'secondary' | 'outline'> = {
  active: 'default',
  on_leave: 'secondary',
  resigned: 'outline',
};

const ROLE_LABEL: Record<UserAccount['role'], string> = {
  teacher: 'Teacher',
  guard: 'Guard',
  admin: 'Admin',
};

interface BuildUserColumnsOptions {
  licenseExpired: boolean;
  onEdit: (account: UserAccount) => void;
  onResetPassword: (account: UserAccount) => void;
  onDeleteRequest: (account: UserAccount) => void;
}

export function buildUserColumns({
  licenseExpired,
  onEdit,
  onResetPassword,
  onDeleteRequest,
}: BuildUserColumnsOptions): ColumnDef<UserAccount>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <Link to={userDetailPath(row.original.uuid)} className="font-medium hover:underline">
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
            account={row.original}
            licenseExpired={licenseExpired}
            onDeleteRequest={onDeleteRequest}
          />
        </div>
      ),
    },
  ];
}
