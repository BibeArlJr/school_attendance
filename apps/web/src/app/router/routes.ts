export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  STUDENTS: '/students',
  STUDENTS_CLASSES: '/students/classes',
  STUDENTS_IMPORT: '/students/import',
  STUDENTS_IMPORT_BATCH: '/students/import/:batchId',
  STUDENT_DETAIL: '/students/:id',
  STUDENT_ID_CARD: '/students/:id/id-card',
  TEACHERS: '/teachers',
  TEACHER_DETAIL: '/teachers/:id',
  PARENTS: '/parents',
  PARENT_DETAIL: '/parents/:id',
  ATTENDANCE: '/attendance',
  GATE_SCANNER: '/gate-scanner',
  BARCODE: '/barcode',
  BARCODE_PRINT: '/barcode/print',
  SMS_LOG: '/sms-log',
  REPORTS: '/reports',
  SETTINGS: '/settings',
} as const;

// Students/Teachers/Parents/Classes are all route-bound by uuid now
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

export function teacherDetailPath(uuid: string): string {
  return `/teachers/${uuid}`;
}
