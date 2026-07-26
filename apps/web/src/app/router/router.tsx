import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, Outlet, useParams } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleGuard } from './RoleGuard';
import { ROUTES, staffDetailPath } from './routes';
import { LoadingSkeleton } from '@/shared/components/feedback/LoadingSkeleton';
import { AppShell } from '@/shared/components/layout/AppShell';
import { RouteErrorBoundary } from '@/shared/components/RouteErrorBoundary';
import { MODULES } from '@/shared/constants/modules';

const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'));
const PlaceholderPage = lazy(() => import('@/shared/components/PlaceholderPage'));
const StudentsLayout = lazy(() => import('@/features/students/pages/StudentsLayout'));
const StudentsPage = lazy(() => import('@/features/students/pages/StudentsPage'));
const ClassesPage = lazy(() => import('@/features/students/pages/ClassesPage'));
const StudentDetailPage = lazy(() => import('@/features/students/pages/StudentDetailPage'));
const ImportPage = lazy(() => import('@/features/students/pages/ImportPage'));
const ImportReviewPage = lazy(() => import('@/features/students/pages/ImportReviewPage'));
const StaffPage = lazy(() => import('@/features/staff/pages/StaffPage'));
const StaffDetailPage = lazy(() => import('@/features/staff/pages/StaffDetailPage'));
const ParentsPage = lazy(() => import('@/features/parents/pages/ParentsPage'));
const ParentDetailPage = lazy(() => import('@/features/parents/pages/ParentDetailPage'));
const BarcodePage = lazy(() => import('@/features/idcards/pages/BarcodePage'));
const BarcodePrintPage = lazy(() => import('@/features/idcards/pages/BarcodePrintPage'));
const IdCardPage = lazy(() => import('@/features/idcards/pages/IdCardPage'));
const GateScannerPage = lazy(() => import('@/features/attendance/pages/GateScannerPage'));
const GateCalendarPage = lazy(() => import('@/features/attendance/pages/GateCalendarPage'));
const AttendancePage = lazy(() => import('@/features/attendance/pages/AttendancePage'));
const SmsLogPage = lazy(() => import('@/features/sms/pages/SmsLogPage'));
const ReportsPage = lazy(() => import('@/features/reports/pages/ReportsPage'));
const SettingsPage = lazy(() => import('@/features/settings/pages/SettingsPage'));
const PlatformSchoolsPage = lazy(() => import('@/features/platform/pages/PlatformSchoolsPage'));
const AuditLogPage = lazy(() => import('@/features/platform/pages/AuditLogPage'));

function withSuspense(element: React.ReactNode) {
  return <Suspense fallback={<LoadingSkeleton className="p-6" />}>{element}</Suspense>;
}

// /teachers/:id used the same uuid /staff/:id does — this preserves a
// bookmarked/shared link to a specific staff member, not just a generic
// bounce to the list (Prompt 34 Part D).
function LegacyStaffDetailRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={id ? staffDetailPath(id) : ROUTES.STAFF} replace />;
}

function withRoleGuard(module: (typeof MODULES)[number], element: React.ReactNode) {
  return (
    <RoleGuard allowedRoles={module.allowedRoles} pageTitle={module.label}>
      {element}
    </RoleGuard>
  );
}

const dashboardModule = MODULES.find((module) => module.key === 'dashboard')!;
const studentsModule = MODULES.find((module) => module.key === 'students')!;
const staffModule = MODULES.find((module) => module.key === 'staff')!;
const parentsModule = MODULES.find((module) => module.key === 'parents')!;
const barcodeModule = MODULES.find((module) => module.key === 'barcode')!;
const attendanceModule = MODULES.find((module) => module.key === 'attendance')!;
const gateScannerModule = MODULES.find((module) => module.key === 'gate-scanner')!;
const smsLogModule = MODULES.find((module) => module.key === 'sms-log')!;
const reportsModule = MODULES.find((module) => module.key === 'reports')!;
const settingsModule = MODULES.find((module) => module.key === 'settings')!;

// Students, Staff, Parents, Barcode, Attendance, Gate Scanner, SMS Log,
// Reports, and Settings now ship real content, so all nine are excluded
// from the generic placeholder generation below (no `phase` on their
// MODULES entries anymore).
const placeholderRoutes = MODULES.filter((module) => module.phase !== undefined).map((module) => ({
  path: module.path,
  element: withSuspense(
    withRoleGuard(module, <PlaceholderPage title={module.label} phase={module.phase!} />),
  ),
}));

export const router = createBrowserRouter([
  {
    // Pathless root wrapping every other route (Prompt 45) — a single
    // shared errorElement here catches a render crash from ANY of them,
    // including the login page and ProtectedRoute/AppShell themselves,
    // not just routes already nested under AppShell. Without this, an
    // uncaught render error had no ancestor errorElement at all, so
    // react-router fell back to its own built-in default: a raw,
    // minified stack trace dumped straight onto the page (confirmed
    // live before this fix).
    element: <Outlet />,
    errorElement: <RouteErrorBoundary />,
    children: [
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
              {
                path: ROUTES.STUDENTS,
                element: withSuspense(withRoleGuard(studentsModule, <StudentsLayout />)),
                children: [
                  { index: true, element: withSuspense(<StudentsPage />) },
                  { path: 'classes', element: withSuspense(<ClassesPage />) },
                ],
              },
              {
                // Sibling to (not nested under) StudentsLayout — a single
                // student's detail view is a drill-down, not a peer of the
                // Students/Classes tabs, so it doesn't show that tab bar.
                path: ROUTES.STUDENT_DETAIL,
                element: withSuspense(withRoleGuard(studentsModule, <StudentDetailPage />)),
              },
              {
                path: ROUTES.STUDENTS_IMPORT,
                element: withSuspense(withRoleGuard(studentsModule, <ImportPage />)),
              },
              {
                path: ROUTES.STUDENTS_IMPORT_BATCH,
                element: withSuspense(withRoleGuard(studentsModule, <ImportReviewPage />)),
              },
              {
                path: ROUTES.STAFF,
                element: withSuspense(withRoleGuard(staffModule, <StaffPage />)),
              },
              {
                path: ROUTES.STAFF_DETAIL,
                element: withSuspense(withRoleGuard(staffModule, <StaffDetailPage />)),
              },
              {
                // Prompt 34 Part D: /teachers renamed to /staff — this keeps
                // any existing bookmark/history entry working instead of a
                // dead link.
                path: ROUTES.LEGACY_TEACHERS,
                element: <Navigate to={ROUTES.STAFF} replace />,
              },
              {
                path: `${ROUTES.LEGACY_TEACHERS}/:id`,
                element: <LegacyStaffDetailRedirect />,
              },
              {
                path: ROUTES.PARENTS,
                element: withSuspense(withRoleGuard(parentsModule, <ParentsPage />)),
              },
              {
                path: ROUTES.PARENT_DETAIL,
                element: withSuspense(withRoleGuard(parentsModule, <ParentDetailPage />)),
              },
              {
                path: ROUTES.BARCODE,
                element: withSuspense(withRoleGuard(barcodeModule, <BarcodePage />)),
              },
              {
                path: ROUTES.BARCODE_PRINT,
                element: withSuspense(withRoleGuard(barcodeModule, <BarcodePrintPage />)),
              },
              {
                path: ROUTES.STUDENT_ID_CARD,
                element: withSuspense(withRoleGuard(barcodeModule, <IdCardPage />)),
              },
              {
                path: ROUTES.ATTENDANCE,
                element: withSuspense(withRoleGuard(attendanceModule, <AttendancePage />)),
              },
              {
                path: ROUTES.GATE_SCANNER,
                element: withSuspense(withRoleGuard(gateScannerModule, <GateScannerPage />)),
              },
              {
                // Same gate-scanner module/roles as above (super_admin/admin/
                // guard) — read-only calendar, reachable by guard without
                // giving guard any access to /settings (Prompt 25 Part D).
                path: ROUTES.GATE_CALENDAR,
                element: withSuspense(withRoleGuard(gateScannerModule, <GateCalendarPage />)),
              },
              {
                path: ROUTES.SMS_LOG,
                element: withSuspense(withRoleGuard(smsLogModule, <SmsLogPage />)),
              },
              {
                path: ROUTES.REPORTS,
                element: withSuspense(withRoleGuard(reportsModule, <ReportsPage />)),
              },
              {
                path: ROUTES.SETTINGS,
                element: withSuspense(withRoleGuard(settingsModule, <SettingsPage />)),
              },
              {
                // Platform Console (Prompt 24) — deliberately NOT driven by
                // MODULES.ts/config('modules.php'): it sits above the
                // per-school module matrix, not inside it, so allowedRoles
                // is passed directly rather than looked up from a module def.
                path: ROUTES.PLATFORM_SCHOOLS,
                element: withSuspense(
                  <RoleGuard allowedRoles={['super_admin']} pageTitle="Platform Console">
                    <PlatformSchoolsPage />
                  </RoleGuard>,
                ),
              },
              {
                path: ROUTES.PLATFORM_AUDIT_LOG,
                element: withSuspense(
                  <RoleGuard allowedRoles={['super_admin']} pageTitle="Audit Log">
                    <AuditLogPage />
                  </RoleGuard>,
                ),
              },
              ...placeholderRoutes,
            ],
          },
        ],
      },
      { path: '*', element: <Navigate to={ROUTES.DASHBOARD} replace /> },
    ],
  },
]);
