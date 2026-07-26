import type { AuditLogEntry } from '../types/auditLog';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { formatDateTime12h } from '@/shared/lib/time';

interface AuditLogDetailDialogProps {
  entry: AuditLogEntry | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * Row-click detail view, same pattern as SmsLogDetailDialog — everything
 * shown is already in the list response, this is just a richer
 * presentation of it, not a second round-trip. before_json/after_json
 * are shown as formatted JSON rather than a bespoke diff view: the shape
 * varies per action (a delete's before is a full record, a settings
 * change's before/after are just the changed fields), so a generic
 * pretty-printed block is the only rendering that's actually correct for
 * every action type this logs.
 */
export function AuditLogDetailDialog({ entry, onOpenChange }: AuditLogDetailDialogProps) {
  return (
    <Dialog open={entry !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Audit log entry</DialogTitle>
        </DialogHeader>
        {entry && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">When</p>
                <p>{formatDateTime12h(entry.created_at)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Action</p>
                <p className="font-mono text-xs">{entry.action}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Actor</p>
                <p>
                  {entry.actor.name} <span className="text-muted-foreground">({entry.actor.email})</span>
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">School</p>
                <p>{entry.school?.name ?? 'Platform-level'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Entity</p>
                <p>
                  {entry.entity_type}
                  {entry.entity_id !== null ? ` #${entry.entity_id}` : ''}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Before</p>
                <pre className="max-h-48 overflow-auto rounded-md border bg-muted/30 p-3 text-xs whitespace-pre-wrap">
                  {entry.before_json ? JSON.stringify(entry.before_json, null, 2) : '—'}
                </pre>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">After</p>
                <pre className="max-h-48 overflow-auto rounded-md border bg-muted/30 p-3 text-xs whitespace-pre-wrap">
                  {entry.after_json ? JSON.stringify(entry.after_json, null, 2) : '—'}
                </pre>
              </div>
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
