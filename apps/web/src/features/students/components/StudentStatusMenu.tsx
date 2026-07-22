import { MoreHorizontal } from 'lucide-react';
import { useUpdateStudentStatus } from '../hooks/useUpdateStudentStatus';
import type { Student, StudentStatus } from '../types';
import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';

const TRANSITIONS: { status: StudentStatus; label: string }[] = [
  { status: 'active', label: 'Reactivate' },
  { status: 'inactive', label: 'Mark as Inactive' },
  { status: 'transferred', label: 'Mark as Transferred' },
  { status: 'alumni', label: 'Mark as Alumni' },
];

interface StudentStatusMenuProps {
  student: Student;
}

export function StudentStatusMenu({ student }: StudentStatusMenuProps) {
  const updateStatus = useUpdateStudentStatus();
  const availableTransitions = TRANSITIONS.filter((t) => t.status !== student.status);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Change status for ${student.first_name}`}>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {availableTransitions.map((transition) => (
          <DropdownMenuItem
            key={transition.status}
            onClick={() => updateStatus.mutate({ id: student.id, status: transition.status })}
          >
            {transition.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
