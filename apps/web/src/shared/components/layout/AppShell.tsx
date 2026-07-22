import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

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

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
  }, [collapsed]);

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
        </main>
      </div>
    </div>
  );
}
