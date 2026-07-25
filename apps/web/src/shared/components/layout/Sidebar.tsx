import { motion } from 'framer-motion';
import { GraduationCap, ChevronLeft, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/authStore';
import { Button } from '@/shared/components/ui/button';
import { MODULES, type ModuleDef } from '@/shared/constants/modules';
import { cn } from '@/shared/lib/utils';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

function SidebarContent({
  modules,
  collapsed,
  onNavigate,
  headerExtra,
}: {
  modules: ModuleDef[];
  collapsed: boolean;
  onNavigate?: () => void;
  headerExtra?: React.ReactNode;
}) {
  return (
    <>
      <div className={cn('flex h-14 items-center gap-2 px-4', collapsed && 'justify-center px-0')}>
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <GraduationCap className="size-4.5" />
        </div>
        {!collapsed && <span className="flex-1 truncate text-sm font-semibold">School ERP</span>}
        {headerExtra}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-2">
        {modules.map((module) => (
          <NavLink
            key={module.key}
            to={module.path}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium outline-none transition-colors',
                'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                'focus-visible:bg-sidebar-accent focus-visible:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring',
                // Keyed off --primary (via bg-primary/10 / text-primary)
                // rather than the neutral --sidebar-accent used for
                // hover/focus above — this is the one spot in the app
                // where "current page" is shown, and it should read as
                // the school's own accent color, not a fixed gray.
                isActive && 'bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary',
                collapsed && 'justify-center px-0',
              )
            }
            title={collapsed ? module.label : undefined}
          >
            <module.icon className="size-4.5 shrink-0" />
            {!collapsed && <span className="truncate">{module.label}</span>}
          </NavLink>
        ))}
      </nav>
    </>
  );
}

export function Sidebar({ collapsed, onToggleCollapsed, mobileOpen, onCloseMobile }: SidebarProps) {
  const role = useAuthStore((state) => state.user?.role);
  // Teachers is unlinked from navigation only (Prompt 16) — the module
  // itself, its Gate, and the /teachers route are all untouched, so it's
  // still fully reachable by a direct URL for admin/super_admin.
  const visibleModules = role
    ? MODULES.filter((module) => module.allowedRoles.includes(role) && module.key !== 'teachers')
    : [];

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="hidden shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar md:flex"
      >
        <SidebarContent modules={visibleModules} collapsed={collapsed} />
        <div className="border-t border-sidebar-border p-2">
          <Button
            variant="ghost"
            size="icon"
            className="w-full justify-center"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft className={cn('size-4 transition-transform', collapsed && 'rotate-180')} />
          </Button>
        </div>
      </motion.aside>

      {/* Mobile off-canvas drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-sidebar-border bg-sidebar">
            <SidebarContent
              modules={visibleModules}
              collapsed={false}
              onNavigate={onCloseMobile}
              headerExtra={
                <Button variant="ghost" size="icon" onClick={onCloseMobile} aria-label="Close menu">
                  <X className="size-4" />
                </Button>
              }
            />
          </aside>
        </div>
      )}
    </>
  );
}
