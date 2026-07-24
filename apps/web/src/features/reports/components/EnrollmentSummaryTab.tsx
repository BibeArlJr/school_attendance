import { Download, Printer } from 'lucide-react';
import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useEnrollmentSummary } from '../hooks/useEnrollmentSummary';
import { exportEnrollmentSummaryCsv } from '../lib/exportEnrollmentSummaryCsv';
import { useClasses } from '@/features/students/hooks/useClasses';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { LoadingSkeleton } from '@/shared/components/feedback/LoadingSkeleton';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  inactive: 'Inactive',
  transferred: 'Transferred',
  alumni: 'Alumni',
};

export function EnrollmentSummaryTab() {
  const [classFilter, setClassFilter] = useState('all');

  const classesQuery = useClasses();
  const summaryQuery = useEnrollmentSummary({
    class_id: classFilter !== 'all' ? Number(classFilter) : undefined,
  });

  const summary = summaryQuery.data;
  const classChartData = summary?.classes.map((schoolClass) => ({
    name: `${schoolClass.name}${schoolClass.section ? ` - ${schoolClass.section}` : ''}`,
    Students: schoolClass.active_students_count,
  }));
  const statusChartData = summary
    ? Object.entries(summary.status_breakdown).map(([status, count]) => ({
        name: STATUS_LABELS[status] ?? status,
        Students: count,
      }))
    : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All classes (status/data quality)" />
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
            disabled={!summary}
            onClick={() => summary && exportEnrollmentSummaryCsv(summary)}
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
      ) : summaryQuery.isError || !summary ? (
        <ErrorState onRetry={() => summaryQuery.refetch()} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-lg border p-4">
              <p className="mb-2 text-sm font-medium text-muted-foreground">Students per class</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={classChartData} margin={{ top: 8, right: 8, left: 0, bottom: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(var(--border))" />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    angle={-35}
                    textAnchor="end"
                    height={50}
                    interval={0}
                    tick={{ fontSize: 11, fill: 'oklch(var(--muted-foreground))' }}
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
                  <Bar dataKey="Students" fill="oklch(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-lg border p-4">
              <p className="mb-2 text-sm font-medium text-muted-foreground">
                Status breakdown{classFilter !== 'all' ? ' (selected class)' : ''}
              </p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={statusChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(var(--border))" />
                  <XAxis
                    dataKey="name"
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
                  <Bar dataKey="Students" fill="oklch(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">
              Data quality{classFilter !== 'all' ? ' (selected class)' : ''}
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Missing gender
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold tracking-tight">
                    {summary.data_quality.missing_gender.count} of {summary.data_quality.total_students}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {summary.data_quality.missing_gender.percentage}% — expected for bulk-imported
                    records
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Missing DOB (AD)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold tracking-tight">
                    {summary.data_quality.missing_dob.count} of {summary.data_quality.total_students}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {summary.data_quality.missing_dob.percentage}% — only dob_bs (BS) on file,
                    AD conversion pending
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    No guardian linked
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold tracking-tight">
                    {summary.data_quality.no_guardian.count} of {summary.data_quality.total_students}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {summary.data_quality.no_guardian.percentage}% — no linked parent/guardian record
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
