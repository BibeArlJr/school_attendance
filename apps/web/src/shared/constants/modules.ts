import {
  LayoutDashboard,
  GraduationCap,
  Users,
  UserRound,
  ClipboardCheck,
  ScanLine,
  Barcode,
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
  /** Roles allowed to see this module. Omitted = every authenticated role. */
  minRole?: UserRole[];
  /** Phase this module ships in. Omitted = already built (Dashboard). */
  phase?: number;
}

export const MODULES: ModuleDef[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: ROUTES.DASHBOARD },
  { key: 'students', label: 'Students', icon: GraduationCap, path: ROUTES.STUDENTS, phase: 2 },
  { key: 'teachers', label: 'Teachers', icon: Users, path: ROUTES.TEACHERS, phase: 2 },
  { key: 'parents', label: 'Parents', icon: UserRound, path: ROUTES.PARENTS, phase: 3 },
  {
    key: 'attendance',
    label: 'Attendance',
    icon: ClipboardCheck,
    path: ROUTES.ATTENDANCE,
    phase: 4,
  },
  {
    key: 'gate-scanner',
    label: 'Gate Scanner',
    icon: ScanLine,
    path: ROUTES.GATE_SCANNER,
    phase: 5,
  },
  { key: 'barcode', label: 'Barcode', icon: Barcode, path: ROUTES.BARCODE, phase: 6 },
  {
    key: 'sms-log',
    label: 'SMS Log',
    icon: MessageSquareText,
    path: ROUTES.SMS_LOG,
    phase: 7,
  },
  { key: 'reports', label: 'Reports', icon: BarChart3, path: ROUTES.REPORTS, phase: 9 },
  {
    key: 'settings',
    label: 'Settings',
    icon: Settings,
    path: ROUTES.SETTINGS,
    phase: 10,
    minRole: ['super_admin', 'admin'],
  },
];
