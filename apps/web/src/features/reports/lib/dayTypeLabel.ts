import type { AttendanceSummaryRow } from '../types';

/**
 * day_type alone can't tell "Saturday" from "an ordinary working day" —
 * both report "working" since day_type is just the calendar override.
 * is_working_day is the real combined signal; this derives the one label
 * worth showing a user.
 */
export function dayTypeLabel(row: Pick<AttendanceSummaryRow, 'day_type' | 'is_working_day'>): string {
  if (row.day_type === 'holiday') return 'Holiday';
  if (row.day_type === 'exam_day') return 'Exam Day';
  if (row.day_type === 'half_day') return 'Half Day';
  if (!row.is_working_day) return 'Non-school day';
  return 'Working';
}
