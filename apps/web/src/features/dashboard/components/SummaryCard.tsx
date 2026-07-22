import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';

interface SummaryCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
}

export function SummaryCard({ label, value, icon: Icon }: SummaryCardProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tracking-tight">{value.toLocaleString()}</p>
      </CardContent>
    </Card>
  );
}
