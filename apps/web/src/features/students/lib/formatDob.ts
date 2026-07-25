import type { Student } from '../types';
import { formatBs, formatBsDate, parseBsDateString } from '@/shared/lib/bikramSambat';

/** Bulk-imported students have no `dob` (AD) — only `dob_bs` (BS) is known for them. */
export function formatDob(student: Pick<Student, 'dob' | 'dob_bs'>): string {
  if (student.dob) {
    return student.dob.slice(0, 10);
  }
  return student.dob_bs ?? '—';
}

/**
 * BS-formatted DOB for display (Prompt 28 Part A) — used on the Student
 * Detail page specifically. Deliberately not swapped into `formatDob`
 * above: that function also feeds the Students list table's DOB column,
 * and this project has been burned before by scope creep into areas a
 * prompt didn't ask for — the list column stays AD/untouched, only the
 * Detail page display changes to BS.
 *
 * Prefers the stored `dob` (converted to BS) when set, since that's
 * always kept in sync with `dob_bs` for any student created/edited after
 * this phase; falls back to the raw `dob_bs` (already BS text) for the
 * ~400 imported students that predate this phase and have no `dob` at
 * all — see Prompt 28's dob-null/populated count report.
 */
export function formatDobBs(student: Pick<Student, 'dob' | 'dob_bs'>): string {
  if (student.dob) {
    return formatBs(student.dob.slice(0, 10));
  }
  if (student.dob_bs) {
    return formatBsDate(parseBsDateString(student.dob_bs));
  }
  return '—';
}
