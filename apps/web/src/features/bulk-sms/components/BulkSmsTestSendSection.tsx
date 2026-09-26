import { Send } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useSendTestSms } from '../hooks/useSendTestSms';
import type { BulkSmsSendLog } from '../types';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { extractErrorMessage } from '@/shared/lib/errors';
import { calculateSmsSegments } from '@/shared/lib/smsSegments';

const STATUS_LABEL: Record<BulkSmsSendLog['status'], string> = {
  sent: 'Sent',
  failed: 'Failed',
  mock: 'Mock (no real request sent)',
};

/**
 * Stage 2's ONLY sending surface — deliberately contains nothing that
 * could ever reach a saved contact: no contact picker, no "select all",
 * no upload/list selection, no multi-number input of any kind. Exactly
 * one plain phone text field, submitted as a single scalar string. The
 * server (BulkSmsTestSendService) is the actual source of truth for
 * whether that number is valid — this UI never re-implements the
 * normalizer, it just shows what was typed until the server responds.
 */
export function BulkSmsTestSendSection() {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const sendTestSms = useSendTestSms();

  const segmentInfo = useMemo(() => calculateSmsSegments(message), [message]);
  const canSend = phone.trim().length > 0 && message.trim().length > 0;

  function handleConfirmSend() {
    // Disabled immediately via isPending below — a second click before
    // the request resolves is a no-op, not a second request.
    sendTestSms.mutate(
      { phone: phone.trim(), message },
      {
        onSuccess: (log) => {
          setConfirmOpen(false);
          if (log.status === 'sent') {
            toast.success(`Test SMS sent to ${log.recipient}.`);
          } else if (log.status === 'mock') {
            toast.info(`Mock test send recorded for ${log.recipient} — no real SMS was sent.`);
          } else {
            toast.error(`Test SMS to ${log.recipient} failed: ${log.provider_response_message ?? 'unknown error'}`);
          }
        },
        onError: (error) => {
          setConfirmOpen(false);
          toast.error(extractErrorMessage(error));
        },
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test SMS</CardTitle>
        <p className="text-sm text-muted-foreground">
          Sends to exactly one manually-entered number — never a saved contact, upload, or list.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="bulk-sms-test-phone">Phone number</Label>
          <Input
            id="bulk-sms-test-phone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="98XXXXXXXX"
            className="max-w-xs"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bulk-sms-test-message">Message</Label>
          <Textarea
            id="bulk-sms-test-message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Type your test message…"
            rows={5}
            className="font-mono text-sm"
            dir="auto"
          />
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>
            Encoding: <span className="font-medium text-foreground">{segmentInfo.encoding}</span>
          </span>
          <span>
            {segmentInfo.length} char{segmentInfo.length === 1 ? '' : 's'}
          </span>
          <span>
            {segmentInfo.segments} SMS segment{segmentInfo.segments === 1 ? '' : 's'}
          </span>
        </div>

        <Button onClick={() => setConfirmOpen(true)} disabled={!canSend}>
          <Send className="size-4" />
          Send Test SMS
        </Button>
      </CardContent>

      <Dialog open={confirmOpen} onOpenChange={(open) => !sendTestSms.isPending && setConfirmOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send TEST SMS?</DialogTitle>
          </DialogHeader>
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">Recipient:</span>{' '}
              <span className="font-mono font-medium">{phone.trim()}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Segments:</span> {segmentInfo.segments}
            </p>
            <p>
              <span className="text-muted-foreground">Estimated SMS messages:</span> {segmentInfo.segments}
            </p>
          </div>
          <p className="rounded-md border border-amber-400 bg-amber-50 p-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            This sends to exactly one recipient — the number above, and no one else.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={sendTestSms.isPending}>
              Cancel
            </Button>
            <Button onClick={handleConfirmSend} disabled={sendTestSms.isPending}>
              {sendTestSms.isPending ? 'Sending…' : 'Send Test SMS'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {sendTestSms.data && (
        <CardContent className="pt-0">
          <div className="rounded-md border bg-muted/50 p-3 text-sm">
            <div className="mb-1 flex items-center gap-2">
              <span className="font-medium">Last attempt:</span>
              <Badge variant={sendTestSms.data.status === 'sent' ? 'default' : 'outline'}>
                {STATUS_LABEL[sendTestSms.data.status]}
              </Badge>
            </div>
            <p>
              <span className="text-muted-foreground">Recipient:</span> {sendTestSms.data.recipient}
            </p>
            {sendTestSms.data.provider_response_message && (
              <p>
                <span className="text-muted-foreground">Provider response:</span>{' '}
                {sendTestSms.data.provider_response_message}
              </p>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
