import { MoreHorizontal, Trash2 } from 'lucide-react';
import { useUpdateStudentStatus } from '../hooks/useUpdateStudentStatus';
import type { Student, StudentStatus } from '../types';
import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { LICENSE_EXPIRED_MESSAGE } from '@/shared/hooks/useLicenseExpired';

const TRANSITIONS: { status: StudentStatus; label: string }[] = [
  { status: 'active', label: 'Reactivate' },
  { status: 'inactive', label: 'Mark as Inactive' },
  { status: 'transferred', label: 'Mark as Transferred' },
  { status: 'alumni', label: 'Mark as Alumni' },
];

interface StudentStatusMenuProps {
  student: Student;
  licenseExpired: boolean;
  onDeleteRequest: (student: Student) => void;
}

export function StudentStatusMenu({ student, licenseExpired, onDeleteRequest }: StudentStatusMenuProps) {
  const updateStatus = useUpdateStudentStatus();
  const availableTransitions = TRANSITIONS.filter((t) => t.status !== student.status);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={licenseExpired}
          title={licenseExpired ? LICENSE_EXPIRED_MESSAGE : undefined}
          aria-label={`Change status for ${student.first_name}`}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {availableTransitions.map((transition) => (
          <DropdownMenuItem
            key={transition.status}
            onClick={() => updateStatus.mutate({ id: student.uuid, status: transition.status })}
          >
            {transition.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => onDeleteRequest(student)}>
          <Trash2 className="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
