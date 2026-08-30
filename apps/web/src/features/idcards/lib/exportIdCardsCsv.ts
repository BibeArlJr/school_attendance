import type { IdCard } from '../types';

// barcode_value is this app's sole human-facing identifier — there is
// no admission_no column (removed, Prompt 16), so it isn't a column
// here either. Staff export (restored, Rebuild Staff Module Part D.6)
// uses its own header row (designation instead of class, no admission
// concept either) rather than padding student-shaped columns with
// blanks — the two owner types are never mixed in one export.
const STUDENT_HEADERS = ['barcode_value', 'student_name', 'class', 'card_status', 'issued_date'];
const STAFF_HEADERS = ['barcode_value', 'staff_name', 'designation', 'card_status', 'issued_date'];

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function toStudentRow(card: IdCard): string {
  const student = card.student;
  const className = student?.school_class
    ? `${student.school_class.name}${student.school_class.section ? ` - ${student.school_class.section}` : ''}`
    : '';

  return [
    card.barcode_value,
    student ? `${student.first_name} ${student.last_name}` : '',
    className,
    card.status,
    card.issued_date.slice(0, 10),
  ]
    .map(csvEscape)
    .join(',');
}

function toStaffRow(card: IdCard): string {
  return [
    card.barcode_value,
    card.staff?.name ?? '',
    card.staff?.designation ?? '',
    card.status,
    card.issued_date.slice(0, 10),
  ]
    .map(csvEscape)
    .join(',');
}

export function exportIdCardsCsv(cards: IdCard[]): void {
  const isStaff = cards[0]?.owner_type === 'staff';
  const headers = isStaff ? STAFF_HEADERS : STUDENT_HEADERS;
  const rows = cards.map(isStaff ? toStaffRow : toStudentRow);
  const csv = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `id-cards-export-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
