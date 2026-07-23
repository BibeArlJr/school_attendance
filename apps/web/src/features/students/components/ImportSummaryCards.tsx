import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';

interface ImportSummaryCardsProps {
  total: number;
  clean: number;
  needsReview: number;
  duplicates: number;
}

export function ImportSummaryCards({ total, clean, needsReview, duplicates }: ImportSummaryCardsProps) {
  const cards = [
    { label: 'Total', value: total },
    { label: 'Clean', value: clean },
    { label: 'Needs Review', value: needsReview },
    { label: 'Duplicates', value: duplicates },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{card.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
