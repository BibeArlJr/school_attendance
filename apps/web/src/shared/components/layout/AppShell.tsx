import { AnimatePresence, motion } from 'framer-motion';
import { Building2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { ROUTES } from '@/app/router/routes';
import { useAuthStore } from '@/features/auth/store/authStore';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { Button } from '@/shared/components/ui/button';

// Same persistence pattern as ThemeProvider (localStorage, read on init,
// write on change).
const SIDEBAR_COLLAPSED_KEY = 'school_erp.sidebar_collapsed';

function getInitialCollapsed(): boolean {
  return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
}

export function AppShell() {
  const [collapsed, setCollapsed] = useState<boolean>(getInitialCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
  }, [collapsed]);

  // super_admin has no school_id of their own — every other page here
  // is school-scoped and would otherwise 409 (NoActiveSchoolSelectedException)
  // on its first API call. Caught here, once, for the whole app rather
  // than in every individual page (Prompt 24). The Platform Console
  // itself must stay reachable — that's where the selection happens.
  const needsSchoolSelection =
    user?.role === 'super_admin' && !user.active_school && location.pathname !== ROUTES.PLATFORM_SCHOOLS;

  return (
    <div className="flex h-svh overflow-hidden bg-muted/30 print:h-auto print:overflow-visible print:bg-white">
      <div className="print:hidden">
        <Sidebar
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((v) => !v)}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col print:overflow-visible">
        <div className="print:hidden">
          <Topbar onOpenMobileMenu={() => setMobileOpen(true)} />
        </div>

        <main className="flex-1 overflow-y-auto print:overflow-visible">
          {needsSchoolSelection ? (
            <div className="p-6">
              <EmptyState
                icon={Building2}
                title="Select a school to manage"
                description="You're signed in as a super admin, which isn't scoped to any single school. Pick one from the Platform Console before continuing."
                action={
                  <Button asChild>
                    <Link to={ROUTES.PLATFORM_SCHOOLS}>Go to Platform Console</Link>
                  </Button>
                }
              />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          )}
        </main>
      </div>
    </div>
  );
}
