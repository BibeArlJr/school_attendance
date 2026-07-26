import { Building2, ChevronDown, ScrollText, Settings2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSchools } from '../hooks/useSchools';
import { useSetActiveSchool } from '../hooks/useSetActiveSchool';
import { useAuthStore } from '@/features/auth/store/authStore';
import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';

/**
 * super_admin-only — visible nowhere for any other role. Switching
 * clears the whole React Query cache (see useSetActiveSchool) so every
 * school-scoped page (Students, Teachers, Attendance, ...) reloads with
 * the newly-selected school's data on its existing routes, unchanged.
 */
export function SchoolSwitcher() {
  const schoolsQuery = useSchools();
  const setActiveSchool = useSetActiveSchool();
  const activeSchool = useAuthStore((state) => state.user?.active_school);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Building2 className="size-4" />
          <span className="max-w-32 truncate">{activeSchool?.name ?? 'Select a school'}</span>
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Managing school</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={activeSchool ? String(activeSchool.id) : undefined}
          onValueChange={(value) => setActiveSchool.mutate(Number(value))}
        >
          {schoolsQuery.data?.map((school) => (
            <DropdownMenuRadioItem key={school.id} value={String(school.id)}>
              {school.name}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/platform/schools">
            <Settings2 className="size-4" />
            Manage schools
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/platform/audit-log">
            <ScrollText className="size-4" />
            Audit log
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
