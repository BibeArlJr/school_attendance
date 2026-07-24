import type { Student } from '../types';

/** Bulk-imported students have no `dob` (AD) — only `dob_bs` (BS) is known for them. */
export function formatDob(student: Pick<Student, 'dob' | 'dob_bs'>): string {
  if (student.dob) {
    return student.dob.slice(0, 10);
  }
  return student.dob_bs ?? '—';
}
