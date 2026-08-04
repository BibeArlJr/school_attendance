import { AnimatePresence } from 'framer-motion';
import { CalendarDays, ScanLine } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ScanFeedback } from '../components/ScanFeedback';
import { useScan } from '../hooks/useScan';
import type { ScanResult } from '../types';
import { ROUTES } from '@/app/router/routes';
import { useAuthStore } from '@/features/auth/store/authStore';
import { PageContainer } from '@/shared/components/layout/PageContainer';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { formatTime12h } from '@/shared/lib/time';
import { getNotificationService } from '@/shared/services/mock';

// How long the big feedback panel stays up before auto-clearing and
// refocusing the input for the next scan — matches the "feel fast, no
// more than ~2 seconds" requirement from the product brief.
const FEEDBACK_DISPLAY_MS = 2000;

function buildNotificationMessage(scan: ScanResult, schoolName: string): string | null {
  if (!scan.student || !scan.record) {
    return null;
  }

  const action = scan.result === 'matched_in' ? 'entered' : 'left';
  const time = scan.result === 'matched_in' ? scan.record.in_time : scan.record.out_time;
  if (!time) {
    return null;
  }

  return `Dear Parent, your child ${scan.student.first_name} ${scan.student.last_name} ${action} ${schoolName} at ${formatTime12h(time)}.`;
}

export default function GateScannerPage() {
  const [barcode, setBarcode] = useState('');
  const [feedback, setFeedback] = useState<ScanResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const clearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scan = useScan();
  const schoolName = useAuthStore((state) => state.user?.school?.name) ?? 'the school';

  useEffect(() => {
    inputRef.current?.focus();
    return () => {
      if (clearTimeoutRef.current) {
        clearTimeout(clearTimeoutRef.current);
      }
    };
  }, []);

  // Page-scoped focus recovery (Prompt 52) — a real bug, confirmed live
  // by the prior diagnostic: clicking anywhere else on this page (the
  // title, the empty feedback area, anywhere) moved focus to <body> with
  // no recovery, so the next physical scan went nowhere until someone
  // manually re-clicked the input. A document listener, not one attached
  // to this component's own JSX, is required to actually cover the page
  // title/description — those render as PageContainer's own siblings of
  // `children`, outside this component's DOM subtree, so a listener
  // scoped to a wrapper div here would never see clicks on them. This
  // still isn't app-wide: it's added on mount and removed on unmount,
  // so it only ever does anything while this page is the one on screen
  // — explicitly NOT an attempt to capture scans from other pages or
  // other browser tabs (confirmed unsolvable by any web app).
  //
  // Genuine interactive elements (the Calendar link, any button, the
  // input itself) are left alone entirely — this only recovers focus
  // when the click landed on plain, non-interactive page content that
  // was never going anywhere anyway.
  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      if (target.closest('a, button, input, textarea, select, [role="button"], [role="link"], [role="dialog"]')) {
        return;
      }
      inputRef.current?.focus();
    }

    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  function refocusSoon() {
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const value = barcode.trim();
    if (!value) {
      return;
    }

    setBarcode('');

    scan.mutate(value, {
      onSuccess: (result) => {
        setFeedback(result);

        if (result.result === 'matched_in' || result.result === 'matched_out') {
          const message = buildNotificationMessage(result, schoolName);
          if (message) {
            void getNotificationService().notify(message);
          }
        }

        if (clearTimeoutRef.current) {
          clearTimeout(clearTimeoutRef.current);
        }
        clearTimeoutRef.current = setTimeout(() => {
          setFeedback(null);
          refocusSoon();
        }, FEEDBACK_DISPLAY_MS);

        refocusSoon();
      },
      onError: refocusSoon,
    });
  }

  return (
    <PageContainer
      title="Gate Scanner"
      description="Scan a student or staff ID card to record entry or exit."
    >
      <div className="mx-auto flex max-w-lg flex-col items-center gap-6 py-6">
        <Button variant="outline" size="sm" className="self-end" asChild>
          <Link to={ROUTES.GATE_CALENDAR}>
            <CalendarDays className="size-4" />
            View School Calendar
          </Link>
        </Button>

        <form onSubmit={handleSubmit} className="w-full">
          <div className="relative">
            <ScanLine className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            {/* Deliberately no .toUpperCase() (or any transformation) here —
                investigated a report that this field "changes the case" of
                what's typed/scanned and confirmed there is none: no CSS
                text-transform, no JS transformation anywhere in this
                component or the scan request path, and this input is
                functionally identical to the Students/Barcode pages'
                search field (shared DataTable component), which has the
                same plain value/onChange with nothing else applied. A
                genuine scan of a real printed card legitimately reads as
                uppercase because id_cards.barcode_value is stored/printed
                in uppercase by convention (case-insensitive-barcode
                prompt) — that's correct, not a bug, and not this
                component's concern either way: case-insensitive MATCHING
                already happens server-side (AttendanceService::
                processScan()), so this input submits exactly what was
                typed/scanned, unmodified, on purpose. */}
            <Input
              ref={inputRef}
              value={barcode}
              onChange={(event) => setBarcode(event.target.value)}
              placeholder="Scan or type QR code, press Enter"
              className="h-14 pl-10 text-base sm:text-lg"
              autoFocus
            />
          </div>
        </form>

        <div className="min-h-72 w-full">
          <AnimatePresence mode="wait">
            {feedback && <ScanFeedback key={feedback.scanned_at} scan={feedback} />}
          </AnimatePresence>
        </div>
      </div>
    </PageContainer>
  );
}
