import { AnimatePresence } from 'framer-motion';
import { ScanLine } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ScanFeedback } from '../components/ScanFeedback';
import { useScan } from '../hooks/useScan';
import type { ScanResult } from '../types';
import { useAuthStore } from '@/features/auth/store/authStore';
import { PageContainer } from '@/shared/components/layout/PageContainer';
import { Input } from '@/shared/components/ui/input';
import { getNotificationService } from '@/shared/services/mock';

// How long the big feedback panel stays up before auto-clearing and
// refocusing the input for the next scan — matches the "feel fast, no
// more than ~2 seconds" requirement from the product brief.
const FEEDBACK_DISPLAY_MS = 2000;

function formatTimeForMessage(time: string): string {
  const [hoursStr, minutesStr] = time.split(':');
  const hours = Number(hoursStr);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHours}:${minutesStr} ${period}`;
}

function buildNotificationMessage(scan: ScanResult, schoolName: string): string | null {
  if (!scan.student || !scan.record) {
    return null;
  }

  const action = scan.result === 'matched_in' ? 'entered' : 'left';
  const time = scan.result === 'matched_in' ? scan.record.in_time : scan.record.out_time;
  if (!time) {
    return null;
  }

  return `Dear Parent, your child ${scan.student.first_name} ${scan.student.last_name} ${action} ${schoolName} at ${formatTimeForMessage(time)}.`;
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
        <form onSubmit={handleSubmit} className="w-full">
          <div className="relative">
            <ScanLine className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={barcode}
              onChange={(event) => setBarcode(event.target.value)}
              placeholder="Scan or type a barcode, then press Enter"
              className="h-14 pl-10 text-lg"
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
