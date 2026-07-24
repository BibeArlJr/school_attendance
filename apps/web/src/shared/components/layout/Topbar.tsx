import { Menu, Moon, Sun, LogOut, KeyRound, User as UserIcon } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '@/app/providers/ThemeProvider';
import { ChangePasswordDialog } from '@/features/auth/components/ChangePasswordDialog';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { useAuthStore } from '@/features/auth/store/authStore';
import { SchoolSwitcher } from '@/features/platform/components/SchoolSwitcher';
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar';
import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';

function initials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  teacher: 'Teacher',
  parent: 'Parent',
  guard: 'Guard',
};

interface TopbarProps {
  onOpenMobileMenu: () => void;
}

export function Topbar({ onOpenMobileMenu }: TopbarProps) {
  const user = useAuthStore((state) => state.user);
  const { theme, toggleTheme } = useTheme();
  const logout = useLogout();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const isSuperAdmin = user?.role === 'super_admin';
  const schoolName = user?.school?.name ?? 'Demo School';

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-background px-4">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onOpenMobileMenu}
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </Button>

      {isSuperAdmin ? (
        <SchoolSwitcher />
      ) : (
        <span className="truncate text-sm font-medium text-foreground">{schoolName}</span>
      )}

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar className="size-7">
                <AvatarFallback className="text-xs">
                  {user ? initials(user.name) : <UserIcon className="size-4" />}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-left text-sm leading-tight sm:block">
                <span className="block font-medium">{user?.name ?? 'Guest'}</span>
                <span className="block text-xs text-muted-foreground">
                  {user ? (ROLE_LABELS[user.role] ?? user.role) : ''}
                </span>
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>
              <span className="block font-medium">{user?.name}</span>
              <span className="block text-xs font-normal text-muted-foreground">{user?.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setChangePasswordOpen(true)}>
              <KeyRound className="size-4" />
              Change Password
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout.mutate()} disabled={logout.isPending}>
              <LogOut className="size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ChangePasswordDialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen} />
    </header>
  );
}
