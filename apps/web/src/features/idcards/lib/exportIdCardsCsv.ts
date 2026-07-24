import type { IdCard } from '../types';

const HEADERS = ['admission_no', 'student_name', 'class', 'barcode_value', 'card_status', 'issued_date'];

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

// This app has no dedicated admission-number field anywhere (confirmed
// against the students table and every existing form/export) — the
// student's own id is the closest stable identifier it actually has, so
// that's what populates this column rather than a fabricated value.
function toRow(card: IdCard): string {
  const student = card.student;
  const className = student?.school_class
    ? `${student.school_class.name}${student.school_class.section ? ` - ${student.school_class.section}` : ''}`
    : '';

  return [
    student ? String(student.id) : '',
    student ? `${student.first_name} ${student.last_name}` : '',
    className,
    card.barcode_value,
    card.status,
    card.issued_date.slice(0, 10),
  ]
    .map(csvEscape)
    .join(',');
}

export function exportIdCardsCsv(cards: IdCard[]): void {
  const csv = [HEADERS.join(','), ...cards.map(toRow)].join('\r\n');
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
