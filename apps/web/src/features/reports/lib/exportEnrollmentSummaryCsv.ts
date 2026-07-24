import type { EnrollmentSummary } from '../types';

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/**
 * A single CSV with three labeled sections (per-class counts, status
 * breakdown, data quality) rather than three separate downloads — mirrors
 * how the tab itself presents one report with three parts.
 */
export function exportEnrollmentSummaryCsv(summary: EnrollmentSummary): void {
  const lines: string[] = [];

  lines.push('Students per class');
  lines.push(['class', 'section', 'active_students_count'].join(','));
  for (const schoolClass of summary.classes) {
    lines.push(
      [schoolClass.name, schoolClass.section ?? '', String(schoolClass.active_students_count)]
        .map(csvEscape)
        .join(','),
    );
  }

  lines.push('');
  lines.push('Status breakdown');
  lines.push(['status', 'count'].join(','));
  for (const [status, count] of Object.entries(summary.status_breakdown)) {
    lines.push([status, String(count)].map(csvEscape).join(','));
  }

  lines.push('');
  lines.push('Data quality');
  lines.push(['metric', 'count', 'percentage', 'of_total'].join(','));
  const total = summary.data_quality.total_students;
  lines.push(
    ['missing_gender', String(summary.data_quality.missing_gender.count), `${summary.data_quality.missing_gender.percentage}%`, String(total)]
      .map(csvEscape)
      .join(','),
  );
  lines.push(
    ['missing_dob', String(summary.data_quality.missing_dob.count), `${summary.data_quality.missing_dob.percentage}%`, String(total)]
      .map(csvEscape)
      .join(','),
  );
  lines.push(
    ['no_guardian', String(summary.data_quality.no_guardian.count), `${summary.data_quality.no_guardian.percentage}%`, String(total)]
      .map(csvEscape)
      .join(','),
  );

  const csv = lines.join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `enrollment-summary-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
