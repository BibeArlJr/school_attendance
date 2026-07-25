import type { ColumnDef } from '@tanstack/react-table';
import type { SmsLog } from '../types';
import { Badge } from '@/shared/components/ui/badge';
import { formatDateTime12h } from '@/shared/lib/time';

const STATUS_VARIANT: Record<SmsLog['status'], 'default' | 'destructive'> = {
  sent: 'default',
  failed: 'destructive',
};

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export function buildSmsLogColumns(): ColumnDef<SmsLog>[] {
  return [
    {
      accessorKey: 'recipient_phone',
      header: 'Recipient',
    },
    {
      id: 'message',
      header: 'Message',
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{truncate(row.original.message, 60)}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <div className="space-y-1">
          <Badge variant={STATUS_VARIANT[row.original.status]} className="capitalize">
            {row.original.status}
          </Badge>
          {/* Failed rows show the provider's actual error, not a generic
              "failed" — that's the whole point of persisting the real
              response code/message rather than a boolean. */}
          {row.original.status === 'failed' && row.original.provider_response_message && (
            <p className="text-xs text-destructive">
              {row.original.provider_response_code
                ? `[${row.original.provider_response_code}] `
                : ''}
              {row.original.provider_response_message}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'sent_at',
      header: 'Sent At',
      cell: ({ row }) => formatDateTime12h(row.original.sent_at),
    },
  ];
}
