export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  STUDENTS: '/students',
  STUDENTS_CLASSES: '/students/classes',
  STUDENTS_IMPORT: '/students/import',
  STUDENTS_IMPORT_BATCH: '/students/import/:batchId',
  STUDENT_DETAIL: '/students/:id',
  STUDENT_ID_CARD: '/students/:id/id-card',
  // Renamed from /staff (Staff -> Users rename). Unlike the earlier
  // /teachers -> /staff rename, the OLD /staff URL can NOT redirect to
  // /users here — /staff is simultaneously the real, canonical URL the
  // NEW HR-domain Staff module below needs (that's the entire point of
  // freeing up the name), so the same path can't be both "a dead
  // redirect source" and "a real page" at once. A bookmark to the old
  // /staff (Users) page now lands on the new Staff (personnel) module
  // instead of a dead link or an infinite redirect — the closer of the
  // two possible outcomes to "still a real, working page," not a true
  // equivalent. Reported as a deliberate, unavoidable trade-off.
  USERS: '/users',
  USER_DETAIL: '/users/:id',
  // Kept only as a redirect source, never rendered directly.
  LEGACY_TEACHERS: '/teachers',
  // New HR-domain personnel module — genuinely independent of Users
  // above (see app/Modules/Staff on the backend).
  STAFF: '/staff',
  STAFF_DETAIL: '/staff/:id',
  STAFF_IMPORT: '/staff/import',
  STAFF_IMPORT_BATCH: '/staff/import/:batchId',
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

// Students/Users/Staff/Parents/Classes are all route-bound by uuid now
// — these always take the uuid string, never the internal numeric id.
// Import batches are unaffected and stay numeric.
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

export function userDetailPath(uuid: string): string {
  return `/users/${uuid}`;
}

export function staffDetailPath(uuid: string): string {
  return `/staff/${uuid}`;
}

export function staffImportBatchPath(batchId: number | string): string {
  return `/staff/import/${batchId}`;
}
