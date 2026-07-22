import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AttendanceTrendPoint } from '@/shared/types';

interface AttendanceTrendChartProps {
  data: AttendanceTrendPoint[];
}

function formatDay(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short' });
}

export function AttendanceTrendChart({ data }: AttendanceTrendChartProps) {
  const chartData = data.map((point) => ({ ...point, label: formatDay(point.date) }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="attendanceTrendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(var(--primary))" stopOpacity={0.22} />
            <stop offset="100%" stopColor="oklch(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(var(--border))" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12, fill: 'oklch(var(--muted-foreground))' }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={32}
          tick={{ fontSize: 12, fill: 'oklch(var(--muted-foreground))' }}
        />
        <Tooltip
          formatter={(value: number) => [value, 'Present']}
          contentStyle={{
            backgroundColor: 'oklch(var(--popover))',
            border: '1px solid oklch(var(--border))',
            borderRadius: 'var(--radius)',
            fontSize: 12,
          }}
          labelStyle={{ color: 'oklch(var(--popover-foreground))' }}
        />
        <Area
          type="monotone"
          dataKey="presentCount"
          stroke="oklch(var(--primary))"
          strokeWidth={2}
          fill="url(#attendanceTrendFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
