export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  STUDENTS: '/students',
  STUDENTS_CLASSES: '/students/classes',
  STUDENTS_IMPORT: '/students/import',
  STUDENTS_IMPORT_BATCH: '/students/import/:batchId',
  STUDENT_DETAIL: '/students/:id',
  STUDENT_ID_CARD: '/students/:id/id-card',
  // Renamed from /teachers (Prompt 34 Part D) — the old path still
  // resolves, see LEGACY_TEACHERS below and its redirect in router.tsx.
  STAFF: '/staff',
  STAFF_DETAIL: '/staff/:id',
  // Kept only as a redirect source, never rendered directly.
  LEGACY_TEACHERS: '/teachers',
  PARENTS: '/parents',
  PARENT_DETAIL: '/parents/:id',
  ATTENDANCE: '/attendance',
  GATE_SCANNER: '/gate-scanner',
  // Guard-reachable, read-only (Prompt 25 Part D) — deliberately NOT
  // under /settings, which guard can't access at all.
  GATE_CALENDAR: '/gate-scanner/calendar',
  BARCODE: '/barcode',
  BARCODE_PRINT: '/barcode/print',
  SMS_LOG: '/sms-log',
  REPORTS: '/reports',
  SETTINGS: '/settings',
  // Platform Console (Prompt 24) — super_admin only, deliberately not a
  // MODULES.ts entry: it sits above the per-school module system, not
  // inside it, so it's reached via the Topbar's school switcher, not the
  // main Sidebar.
  PLATFORM_SCHOOLS: '/platform/schools',
  // Same platform-admin gate as PLATFORM_SCHOOLS — accountability trail
  // is platform-operator infrastructure, not a per-school module either
  // (Prompt 43).
  PLATFORM_AUDIT_LOG: '/platform/audit-log',
} as const;

// Students/Staff/Parents/Classes are all route-bound by uuid now
// (Prompt 16) — these always take the uuid string, never the internal
// numeric id. Import batches are unaffected (out of Prompt 16's scope)
// and stay numeric.
export function studentDetailPath(uuid: string): string {
  return `/students/${uuid}`;
}

export function parentDetailPath(uuid: string): string {
  return `/parents/${uuid}`;
}

export function studentIdCardPath(uuid: string): string {
  return `/students/${uuid}/id-card`;
}

export function studentImportBatchPath(batchId: number | string): string {
  return `/students/import/${batchId}`;
}

export function staffDetailPath(uuid: string): string {
  return `/staff/${uuid}`;
}
