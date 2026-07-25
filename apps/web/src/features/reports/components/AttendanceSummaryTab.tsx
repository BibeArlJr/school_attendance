import { Download, Printer } from 'lucide-react';
import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAttendanceSummary } from '../hooks/useAttendanceSummary';
import { dayTypeLabel } from '../lib/dayTypeLabel';
import { exportAttendanceSummaryCsv } from '../lib/exportAttendanceSummaryCsv';
import { useClasses } from '@/features/students/hooks/useClasses';
import { BsDateRangePicker } from '@/shared/components/BsDateRangePicker';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { LoadingSkeleton } from '@/shared/components/feedback/LoadingSkeleton';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysAgo(n: number): string {
  const date = new Date();
  date.setDate(date.getDate() - n);
  return date.toISOString().slice(0, 10);
}

export function AttendanceSummaryTab() {
  const [from, setFrom] = useState(daysAgo(6));
  const [to, setTo] = useState(today());
  const [classFilter, setClassFilter] = useState('all');

  const classesQuery = useClasses();
  const summaryQuery = useAttendanceSummary({
    from,
    to,
    class_id: classFilter !== 'all' ? Number(classFilter) : undefined,
  });

  const rows = summaryQuery.data ?? [];
  const chartData = rows.map((row) => ({
    date: row.date.slice(5),
    Present: row.present,
    Absent: row.absent,
    Late: row.late,
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <div className="w-72">
          <BsDateRangePicker
            startValue={from}
            endValue={to}
            onChange={(start, end) => {
              // Mirrors exactly what the picker reports — including a
              // blank `end` mid-selection — since BsDateRangePicker is
              // fully controlled and expects its startValue/endValue
              // props to match its own last onChange call precisely (a
              // stale non-empty `end` here would make it think a range
              // was already complete and start a new one on the next
              // click). useAttendanceSummary won't fire on an incomplete
              // range (enabled: Boolean(from && to)).
              setFrom(start);
              setTo(end);
            }}
          />
        </div>
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All classes</SelectItem>
            {classesQuery.data?.map((schoolClass) => (
              <SelectItem key={schoolClass.id} value={String(schoolClass.id)}>
                {schoolClass.name}
                {schoolClass.section ? ` - ${schoolClass.section}` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto flex gap-2">
          <Button
            variant="outline"
            disabled={rows.length === 0}
            onClick={() => exportAttendanceSummaryCsv(rows)}
          >
            <Download className="size-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="size-4" />
            Print
          </Button>
        </div>
      </div>

      {summaryQuery.isLoading ? (
        <LoadingSkeleton lines={4} />
      ) : summaryQuery.isError ? (
        <ErrorState onRetry={() => summaryQuery.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState title="No days in the selected range" />
      ) : (
        <>
          <div className="rounded-lg border p-4">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(var(--border))" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: 'oklch(var(--muted-foreground))' }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={32}
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: 'oklch(var(--muted-foreground))' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'oklch(var(--popover))',
                    border: '1px solid oklch(var(--border))',
                    borderRadius: 'var(--radius)',
                    fontSize: 12,
                  }}
                  labelStyle={{ color: 'oklch(var(--popover-foreground))' }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Present" fill="oklch(0.65 0.15 155)" />
                <Bar dataKey="Late" fill="oklch(0.8 0.15 85)" />
                <Bar dataKey="Absent" fill="oklch(0.65 0.2 25)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Day</TableHead>
                <TableHead>Present</TableHead>
                <TableHead>Late</TableHead>
                <TableHead>Absent</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.date}>
                  <TableCell>{row.date}</TableCell>
                  <TableCell>
                    {row.is_working_day ? (
                      <span className="text-muted-foreground">{dayTypeLabel(row)}</span>
                    ) : (
                      <Badge variant="outline">{dayTypeLabel(row)}</Badge>
                    )}
                  </TableCell>
                  <TableCell>{row.present}</TableCell>
                  <TableCell>{row.late}</TableCell>
                  <TableCell>{row.absent}</TableCell>
                  <TableCell>{row.total}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </div>
  );
}
