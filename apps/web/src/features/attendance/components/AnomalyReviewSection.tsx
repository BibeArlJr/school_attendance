import { useState } from 'react';
import { useAnomalies } from '../hooks/useAnomalies';
import { useReviewAnomaly } from '../hooks/useReviewAnomaly';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { LoadingSkeleton } from '@/shared/components/feedback/LoadingSkeleton';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';

const RESULT_LABEL: Record<string, string> = {
  unknown_barcode: 'Unknown barcode',
  card_inactive: 'Card inactive',
  owner_inactive: 'Record inactive',
  matched_in: 'Entry (flagged)',
  matched_out: 'Exit (flagged)',
};

export function AnomalyReviewSection() {
  const anomaliesQuery = useAnomalies(1);
  const reviewAnomaly = useReviewAnomaly();
  const [notes, setNotes] = useState<Record<number, string>>({});

  return (
    <Card>
      <CardHeader>
        <CardTitle>Anomaly review</CardTitle>
      </CardHeader>
      <CardContent>
        {anomaliesQuery.isLoading ? (
          <LoadingSkeleton lines={3} />
        ) : !anomaliesQuery.data || anomaliesQuery.data.data.length === 0 ? (
          <EmptyState title="No flagged events" description="Nothing needs review right now." />
        ) : (
          <ul className="divide-y">
            {anomaliesQuery.data.data.map((event) => (
              <li key={event.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{RESULT_LABEL[event.result] ?? event.result}</Badge>
                    <span className="text-sm text-muted-foreground">{event.barcode_value}</span>
                  </div>
                  <p className="text-sm">
                    {event.student
                      ? `${event.student.first_name} ${event.student.last_name}`
                      : (event.staff?.name ?? 'Unresolved')}
                    {' · '}
                    {new Date(event.scanned_at).toLocaleString()}
                    {event.gate_device ? ` · ${event.gate_device.name}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Optional note"
                    value={notes[event.id] ?? ''}
                    onChange={(e) => setNotes((current) => ({ ...current, [event.id]: e.target.value }))}
                    className="w-48"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={reviewAnomaly.isPending}
                    onClick={() =>
                      reviewAnomaly.mutate({ eventId: event.id, reviewNote: notes[event.id] || undefined })
                    }
                  >
                    Mark reviewed
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
