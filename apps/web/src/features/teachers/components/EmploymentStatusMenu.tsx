import { MoreHorizontal } from 'lucide-react';
import { useUpdateEmploymentStatus } from '../hooks/useUpdateEmploymentStatus';
import type { EmploymentStatus, Teacher } from '../types';
import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';

const TRANSITIONS: { status: EmploymentStatus; label: string }[] = [
  { status: 'active', label: 'Mark as Active' },
  { status: 'on_leave', label: 'Mark as On Leave' },
  { status: 'resigned', label: 'Mark as Resigned' },
];

interface EmploymentStatusMenuProps {
  teacher: Teacher;
}

export function EmploymentStatusMenu({ teacher }: EmploymentStatusMenuProps) {
  const updateStatus = useUpdateEmploymentStatus();
  const availableTransitions = TRANSITIONS.filter((t) => t.status !== teacher.employment_status);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Change employment status for ${teacher.name}`}>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {availableTransitions.map((transition) => (
          <DropdownMenuItem
            key={transition.status}
            onClick={() =>
              updateStatus.mutate({ id: teacher.id, employmentStatus: transition.status })
            }
          >
            {transition.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
