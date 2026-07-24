import type { ColumnDef } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import type { Teacher } from '../types';
import { EmploymentStatusMenu } from './EmploymentStatusMenu';
import { teacherDetailPath } from '@/app/router/routes';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';

const STATUS_VARIANT: Record<Teacher['employment_status'], 'default' | 'secondary' | 'outline'> = {
  active: 'default',
  on_leave: 'secondary',
  resigned: 'outline',
};

interface BuildTeacherColumnsOptions {
  onEdit: (teacher: Teacher) => void;
  onResetPassword: (teacher: Teacher) => void;
  onDeleteRequest: (teacher: Teacher) => void;
}

export function buildTeacherColumns({
  onEdit,
  onResetPassword,
  onDeleteRequest,
}: BuildTeacherColumnsOptions): ColumnDef<Teacher>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <Link to={teacherDetailPath(row.original.uuid)} className="font-medium hover:underline">
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: 'designation',
      header: 'Designation',
    },
    {
      accessorKey: 'joined_date',
      header: 'Joined',
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
          <Button variant="ghost" size="sm" onClick={() => onEdit(row.original)}>
            Edit
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onResetPassword(row.original)}>
            Reset password
          </Button>
          <EmploymentStatusMenu teacher={row.original} onDeleteRequest={onDeleteRequest} />
        </div>
      ),
    },
  ];
}
