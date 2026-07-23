import { useSmsCredits } from '../hooks/useSmsCredits';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';

export function CreditsCard() {
  const creditsQuery = useSmsCredits();
  const credits = creditsQuery.data;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">SMS Credit Balance</CardTitle>
        {credits?.driver === 'mock' && <Badge variant="outline">Mock mode</Badge>}
      </CardHeader>
      <CardContent>
        {creditsQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !credits ? (
          <p className="text-sm text-muted-foreground">Unable to load credit balance.</p>
        ) : credits.driver === 'mock' ? (
          <p className="text-sm text-muted-foreground">
            No real SMS gateway is configured — this page is showing mock data, not a real balance.
          </p>
        ) : (
          <div className="flex items-baseline gap-4">
            <p className="text-2xl font-semibold">{credits.credits_available}</p>
            <p className="text-sm text-muted-foreground">available · {credits.credits_consumed} consumed</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
