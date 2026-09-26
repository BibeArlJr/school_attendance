import { Send } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Textarea } from '@/shared/components/ui/textarea';
import { calculateSmsSegments } from '@/shared/lib/smsSegments';

interface BulkSmsMessageComposerProps {
  /** Total number of saved contacts right now — the "available
   *  recipients" this stage's estimate is based on (there is no
   *  audience/segment concept in this module — see the module's own
   *  scope notes). */
  recipientCount: number;
  isLoadingRecipientCount: boolean;
}

/**
 * Preview-only, by design (this stage's explicit scope) — no message is
 * ever sent or persisted here. Reuses the exact same generic segment
 * calculator the SMS Templates editor already uses (shared/lib/
 * smsSegments.ts), unmodified.
 */
export function BulkSmsMessageComposer({ recipientCount, isLoadingRecipientCount }: BulkSmsMessageComposerProps) {
  const [message, setMessage] = useState('');
  const segmentInfo = useMemo(() => calculateSmsSegments(message), [message]);
  const estimatedTotalSegments = recipientCount * segmentInfo.segments;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compose Message</CardTitle>
        <p className="text-sm text-muted-foreground">
          Preview only at this stage — sending is not enabled yet.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Type your message…"
          rows={6}
          className="font-mono text-sm"
          dir="auto"
        />

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>
            Encoding: <span className="font-medium text-foreground">{segmentInfo.encoding}</span>
          </span>
          <span>
            {segmentInfo.length} char{segmentInfo.length === 1 ? '' : 's'}
          </span>
          <span>
            {segmentInfo.segments} SMS segment{segmentInfo.segments === 1 ? '' : 's'} per message
          </span>
          {segmentInfo.encoding === 'Unicode' && (
            <span className="text-amber-700 dark:text-amber-400">
              Devanagari/non-ASCII text always uses Unicode encoding — {segmentInfo.singleSegmentLimit} chars
              per single SMS instead of 160.
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-md border p-3 text-center">
            <p className="text-xs text-muted-foreground">Available recipients</p>
            <p className="text-lg font-semibold">{isLoadingRecipientCount ? '…' : recipientCount}</p>
          </div>
          <div className="rounded-md border p-3 text-center">
            <p className="text-xs text-muted-foreground">Segments per message</p>
            <p className="text-lg font-semibold">{segmentInfo.segments}</p>
          </div>
          <div className="rounded-md border p-3 text-center">
            <p className="text-xs text-muted-foreground">Estimated total segments</p>
            <p className="text-lg font-semibold">{isLoadingRecipientCount ? '…' : estimatedTotalSegments}</p>
          </div>
        </div>

        <div className="rounded-md border bg-muted/50 p-3">
          <p className="mb-1 text-xs font-medium text-muted-foreground">Preview</p>
          <p className="text-sm" dir="auto">
            {message || <span className="italic text-muted-foreground">Nothing typed yet</span>}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button disabled title="Sending is not enabled yet at this stage.">
            <Send className="size-4" />
            Send
          </Button>
          <Badge variant="outline">Sending disabled</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Real SMS sending is out of scope for this stage — this composer only calculates cost and
          previews the message. No message is saved or sent from here.
        </p>
      </CardContent>
    </Card>
  );
}
