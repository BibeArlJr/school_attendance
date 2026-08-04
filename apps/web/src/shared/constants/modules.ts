import {
  LayoutDashboard,
  GraduationCap,
  Users,
  UserRound,
  ClipboardCheck,
  ScanLine,
  QrCode,
  MessageSquareText,
  BarChart3,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { ROUTES } from '@/app/router/routes';
import type { UserRole } from '@/features/auth/types';

export interface ModuleDef {
  key: string;
  label: string;
  icon: LucideIcon;
  path: string;
  /**
   * Roles allowed to access this module — the single source of truth for
   * both sidebar visibility and route-level enforcement (RoleGuard).
   * Required, not a "minimum" role threshold: a plain hierarchy can't
   * express e.g. "guard and admin but not teacher" (Gate Scanner), so this
   * is an explicit allow-list. Kept in sync manually with
   * apps/api/config/modules.php — see ADR 0003.
   */
  allowedRoles: UserRole[];
  /** Phase this module ships in. Omitted = already built (Dashboard). */
  phase?: number;
}

const ALL_STAFF_ROLES: UserRole[] = ['super_admin', 'admin', 'teacher', 'guard'];

export const MODULES: ModuleDef[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: ROUTES.DASHBOARD,
    allowedRoles: ALL_STAFF_ROLES,
  },
  {
    key: 'students',
    label: 'Students',
    icon: GraduationCap,
    path: ROUTES.STUDENTS,
    // No `phase` — Students ships real content this phase, not a placeholder.
    allowedRoles: ['super_admin', 'admin', 'teacher'],
  },
  {
    // Prompt 26 generalized this page to manage both teacher and guard
    // staff accounts (a unified list with a role column/filter, not a
    // separate Guards page); Prompt 34 finishes the rename this label
    // already anticipated — key/path/Gate are now 'staff' throughout,
    // matching apps/api/config/modules.php.
    key: 'staff',
    label: 'Staff',
    icon: Users,
    path: ROUTES.STAFF,
    // No `phase` — this ships real content, not a placeholder.
    allowedRoles: ['super_admin', 'admin'],
  },
  {
    key: 'parents',
    label: 'Parents',
    icon: UserRound,
    path: ROUTES.PARENTS,
    // No `phase` — Parents ships real content this phase, not a placeholder.
    allowedRoles: ['super_admin', 'admin'],
  },
  {
    key: 'attendance',
    label: 'Attendance',
    icon: ClipboardCheck,
    path: ROUTES.ATTENDANCE,
    // No `phase` — Attendance ships real content this phase, not a placeholder.
    allowedRoles: ALL_STAFF_ROLES,
  },
  {
    key: 'gate-scanner',
    label: 'Gate Scanner',
    icon: ScanLine,
    path: ROUTES.GATE_SCANNER,
    // No `phase` — Gate Scanner ships real content this phase, not a placeholder.
    allowedRoles: ['super_admin', 'admin', 'guard'],
  },
  {
    key: 'barcode',
    label: 'QR Code',
    icon: QrCode,
    path: ROUTES.BARCODE,
    // No `phase` — Barcode ships real content this phase, not a placeholder.
    // Widened to include teacher (read-only) — reissue is gated separately,
    // same split Students got in Phase 4.
    allowedRoles: ['super_admin', 'admin', 'teacher'],
  },
  {
    key: 'sms-log',
    label: 'SMS Log',
    icon: MessageSquareText,
    path: ROUTES.SMS_LOG,
    // No `phase` — SMS Log ships real content this phase, not a placeholder.
    allowedRoles: ['super_admin', 'admin'],
  },
  {
    key: 'reports',
    label: 'Reports',
    icon: BarChart3,
    path: ROUTES.REPORTS,
    // No `phase` — Reports ships real content this phase, not a placeholder.
    allowedRoles: ['super_admin', 'admin', 'teacher'],
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: Settings,
    path: ROUTES.SETTINGS,
    // No `phase` — Settings ships real content this phase, not a placeholder.
    allowedRoles: ['super_admin', 'admin'],
  },
];
