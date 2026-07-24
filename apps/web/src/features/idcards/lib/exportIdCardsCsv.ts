import type { IdCard } from '../types';

// barcode_value is this app's sole human-facing student identifier —
// there is no admission_no column (removed, Prompt 16), so it isn't a
// column here either.
const HEADERS = ['barcode_value', 'student_name', 'class', 'card_status', 'issued_date'];

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function toRow(card: IdCard): string {
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
