import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGateCalendar } from '../hooks/useGateCalendar';
import { ROUTES } from '@/app/router/routes';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { LoadingSkeleton } from '@/shared/components/feedback/LoadingSkeleton';
import { PageContainer } from '@/shared/components/layout/PageContainer';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { formatBs } from '@/shared/lib/bikramSambat';
import { formatTime12h } from '@/shared/lib/time';

const DAY_TYPE_LABEL: Record<string, string> = {
  working: 'Working (override)',
  holiday: 'Holiday',
  half_day: 'Half day',
  exam_day: 'Exam day',
};

const DAY_TYPE_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  working: 'outline',
  holiday: 'default',
  half_day: 'secondary',
  exam_day: 'secondary',
};

/**
 * View-only for guard (and admin/super_admin, who already have the full
 * Settings > Calendar CRUD) — this page has no add/edit/delete anywhere,
 * and deliberately isn't part of /settings, which guard can't reach at
 * all (Prompt 25 Part D).
 */
export default function GateCalendarPage() {
  const calendarQuery = useGateCalendar();

  return (
    <PageContainer
      title="School Calendar"
      description="Holidays, half-days, and exam days — view only."
    >
      <div className="mb-4 print:hidden">
        <Button variant="outline" size="sm" asChild>
          <Link to={ROUTES.GATE_SCANNER}>
            <ArrowLeft className="size-4" />
            Back to Gate Scanner
          </Link>
        </Button>
      </div>

      {calendarQuery.isLoading ? (
        <LoadingSkeleton lines={4} />
      ) : calendarQuery.isError ? (
        <ErrorState onRetry={() => calendarQuery.refetch()} />
      ) : !calendarQuery.data || calendarQuery.data.length === 0 ? (
        <EmptyState title="No calendar entries yet" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Label</TableHead>
              <TableHead>Half day ends</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {calendarQuery.data.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>
                  <div>{formatBs(entry.date.slice(0, 10))}</div>
                  <div className="text-xs text-muted-foreground">{entry.date.slice(0, 10)} AD</div>
                </TableCell>
                <TableCell>
                  <Badge variant={DAY_TYPE_VARIANT[entry.day_type]}>
                    {DAY_TYPE_LABEL[entry.day_type]}
                  </Badge>
                </TableCell>
                <TableCell>{entry.label ?? '—'}</TableCell>
                <TableCell>
                  {entry.half_day_end_time ? formatTime12h(entry.half_day_end_time) : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </PageContainer>
  );
}
