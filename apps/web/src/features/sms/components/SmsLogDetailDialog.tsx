import { Link } from 'react-router-dom';
import type { SmsLog } from '../types';
import { studentDetailPath } from '@/app/router/routes';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';

interface SmsLogDetailDialogProps {
  log: SmsLog | null;
  onOpenChange: (open: boolean) => void;
}

const STATUS_VARIANT: Record<SmsLog['status'], 'default' | 'destructive'> = {
  sent: 'default',
  failed: 'destructive',
};

/**
 * Row-click detail view (Prompt 36 Part A) — the list already truncates
 * the message and never linked back to the student a scan notification
 * was about. Everything shown here already flows through the same list
 * response (SmsLogResource), so this is purely a richer presentation of
 * data already fetched, not a second API round-trip.
 */
export function SmsLogDetailDialog({ log, onOpenChange }: SmsLogDetailDialogProps) {
  return (
    <Dialog open={log !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>SMS detail</DialogTitle>
        </DialogHeader>
        {log && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant={STATUS_VARIANT[log.status]} className="capitalize">
                {log.status}
              </Badge>
              <span className="text-muted-foreground">{new Date(log.sent_at).toLocaleString()}</span>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Recipient</p>
              <p>{log.recipient_phone}</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Message</p>
              <p className="whitespace-pre-wrap rounded-md border bg-muted/30 p-3">{log.message}</p>
            </div>

            {log.status === 'failed' && (
              <div className="space-y-1 rounded-md border border-destructive/50 bg-destructive/5 p-3">
                <p className="text-xs font-medium text-destructive">Provider response</p>
                <p className="text-destructive">
                  {log.provider_response_code ? `[${log.provider_response_code}] ` : ''}
                  {log.provider_response_message ?? 'No response details recorded.'}
                </p>
              </div>
            )}

            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Related student</p>
              {log.student ? (
                <Button asChild variant="link" className="h-auto p-0">
                  <Link to={studentDetailPath(log.student.uuid)}>
                    {log.student.first_name} {log.student.last_name}
                  </Link>
                </Button>
              ) : (
                <p className="text-muted-foreground">
                  No related student record (the attendance record this notification was tied to no
                  longer exists or isn&apos;t linked to a student).
                </p>
              )}
            </div>
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
