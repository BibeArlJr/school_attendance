import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleGuard } from './RoleGuard';
import { ROUTES } from './routes';
import { LoadingSkeleton } from '@/shared/components/feedback/LoadingSkeleton';
import { AppShell } from '@/shared/components/layout/AppShell';
import { MODULES } from '@/shared/constants/modules';

const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'));
const PlaceholderPage = lazy(() => import('@/shared/components/PlaceholderPage'));

function withSuspense(element: React.ReactNode) {
  return <Suspense fallback={<LoadingSkeleton className="p-6" />}>{element}</Suspense>;
}

function withRoleGuard(module: (typeof MODULES)[number], element: React.ReactNode) {
  return (
    <RoleGuard allowedRoles={module.allowedRoles} pageTitle={module.label}>
      {element}
    </RoleGuard>
  );
}

const dashboardModule = MODULES.find((module) => module.key === 'dashboard')!;

const placeholderRoutes = MODULES.filter((module) => module.phase !== undefined).map((module) => ({
  path: module.path,
  element: withSuspense(
    withRoleGuard(module, <PlaceholderPage title={module.label} phase={module.phase!} />),
  ),
}));

export const router = createBrowserRouter([
  {
    path: ROUTES.LOGIN,
    element: withSuspense(<LoginPage />),
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate to={ROUTES.DASHBOARD} replace /> },
          {
            path: ROUTES.DASHBOARD,
            element: withSuspense(withRoleGuard(dashboardModule, <DashboardPage />)),
          },
          ...placeholderRoutes,
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to={ROUTES.DASHBOARD} replace /> },
]);
