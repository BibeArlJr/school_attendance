import { ArrowLeft, Printer } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { IdCardView } from '../components/IdCardView';
import type { IdCard } from '../types';
import { ROUTES } from '@/app/router/routes';
import { useAuthStore } from '@/features/auth/store/authStore';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { PageContainer } from '@/shared/components/layout/PageContainer';
import { Button } from '@/shared/components/ui/button';

interface BarcodePrintLocationState {
  cards: IdCard[];
}

/**
 * Transient print-prep view, not a bookmarkable page — the selected cards
 * (already fetched client-side via BarcodePage's bulk selection) travel
 * here through router state rather than being re-fetched by id, since
 * there's no dedicated backend endpoint for "these N specific cards" and
 * Phase 15 adds none. Landing here directly (no state) just means
 * nothing was selected — send the user back rather than erroring.
 */
export default function BarcodePrintPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const schoolName = useAuthStore((state) => state.user?.school?.name) ?? 'Your School';
  const cards = (location.state as BarcodePrintLocationState | null)?.cards ?? [];

  if (cards.length === 0) {
    return (
      <PageContainer title="Print ID Cards">
        <EmptyState title="No cards selected" />
        <div className="mt-4 flex justify-center">
          <Button variant="outline" onClick={() => navigate(ROUTES.BARCODE)}>
            <ArrowLeft className="size-4" />
            Back to QR Code / ID Cards
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title={`Print ID Cards (${cards.length})`}>
      <div className="mb-2 flex justify-center gap-2 print:hidden">
        <Button variant="outline" onClick={() => navigate(ROUTES.BARCODE)}>
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <Button onClick={() => window.print()}>
          <Printer className="size-4" />
          Print
        </Button>
      </div>
      {/* print:hidden — same reasoning as IdCardPage's identical note
          (Prompt 52): guidance for the print dialog, not the card itself. */}
      <p className="mb-4 text-center text-xs text-muted-foreground print:hidden">
        For best QR code scan reliability, set your print dialog to{' '}
        <strong>100% / Actual Size</strong> — do not use &quot;Fit to Page&quot;.
      </p>

      {/* Each card keeps break-inside-avoid so printing never cuts one in
          half across a page boundary — the grid itself reflows onto as
          many printed pages as it needs, no manual per-page grouping. */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-2 print:gap-4">
        {cards.map((card) => (
          <div key={card.id} className="break-inside-avoid">
            <IdCardView card={card} schoolName={schoolName} />
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
