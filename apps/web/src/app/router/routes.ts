export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  STUDENTS: '/students',
  STUDENTS_CLASSES: '/students/classes',
  STUDENT_DETAIL: '/students/:id',
  STUDENT_ID_CARD: '/students/:id/id-card',
  TEACHERS: '/teachers',
  TEACHER_DETAIL: '/teachers/:id',
  PARENTS: '/parents',
  PARENT_DETAIL: '/parents/:id',
  ATTENDANCE: '/attendance',
  GATE_SCANNER: '/gate-scanner',
  BARCODE: '/barcode',
  SMS_LOG: '/sms-log',
  REPORTS: '/reports',
  SETTINGS: '/settings',
} as const;

export function studentDetailPath(id: number | string): string {
  return `/students/${id}`;
}

export function parentDetailPath(id: number | string): string {
  return `/parents/${id}`;
}

export function studentIdCardPath(id: number | string): string {
  return `/students/${id}/id-card`;
}

export function teacherDetailPath(id: number | string): string {
  return `/teachers/${id}`;
}
