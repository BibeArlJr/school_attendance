import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';

interface ImportSummaryCardsProps {
  total: number;
  clean: number;
  needsReview: number;
}

// Same shape as students/components/ImportSummaryCards, minus the
// separate "Duplicates" card — here a duplicate row already needs
// review, there's no other bucket it could be in (unlike the student
// import, where "needs review" means unrecognized_class specifically,
// a materially different condition from possible_duplicate).
export function ImportSummaryCards({ total, clean, needsReview }: ImportSummaryCardsProps) {
  const cards = [
    { label: 'Total', value: total },
    { label: 'Clean', value: clean },
    { label: 'Needs Review', value: needsReview },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
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
