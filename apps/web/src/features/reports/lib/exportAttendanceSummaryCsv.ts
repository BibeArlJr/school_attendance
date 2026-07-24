import type { AttendanceSummaryRow } from '../types';

const HEADERS = ['date', 'present', 'absent', 'late', 'total', 'day_type', 'is_working_day'];

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function toRow(row: AttendanceSummaryRow): string {
  return [
    row.date,
    String(row.present),
    String(row.absent),
    String(row.late),
    String(row.total),
    row.day_type,
    String(row.is_working_day),
  ]
    .map(csvEscape)
    .join(',');
}

export function exportAttendanceSummaryCsv(rows: AttendanceSummaryRow[]): void {
  const csv = [HEADERS.join(','), ...rows.map(toRow)].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `attendance-summary-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
