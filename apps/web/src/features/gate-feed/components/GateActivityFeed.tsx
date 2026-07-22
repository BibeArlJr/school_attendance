import { AnimatePresence, motion } from 'framer-motion';
import { LogIn, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useGateFeed } from '../hooks/useGateFeed';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { cn } from '@/shared/lib/utils';
import type { GateEvent } from '@/shared/types';

function initials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function formatRelativeTime(isoTimestamp: string, now: number): string {
  const seconds = Math.max(0, Math.round((now - new Date(isoTimestamp).getTime()) / 1000));
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.round(minutes / 60)}h ago`;
}

const SMS_TAG_STYLES: Record<GateEvent['smsStatus'], string> = {
  sent: 'bg-muted text-muted-foreground',
  pending: 'bg-accent text-accent-foreground',
  failed: 'bg-destructive/10 text-destructive',
};

export function GateActivityFeed() {
  const { events, error } = useGateFeed();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Gate Activity</CardTitle>
        {!error && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
            </span>
            Live
          </span>
        )}
      </CardHeader>
      <CardContent className="flex-1">
        {error ? (
          <ErrorState title="Gate feed unavailable" description={error.message} />
        ) : events.length === 0 ? (
          <EmptyState
            title="Waiting for gate activity…"
            description="New scans will appear here as they happen."
          />
        ) : (
          <ul className="max-h-80 space-y-1 overflow-y-auto">
            <AnimatePresence initial={false}>
              {events.map((event) => (
                <motion.li
                  key={event.id}
                  layout
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="flex items-center gap-3 rounded-md px-2 py-1.5 text-sm"
                >
                  {event.type === 'entry' ? (
                    <LogIn className="size-3.5 shrink-0 text-muted-foreground" />
                  ) : (
                    <LogOut className="size-3.5 shrink-0 text-muted-foreground" />
                  )}
                  <Avatar className="size-7 shrink-0">
                    <AvatarFallback className="text-[11px]">
                      {initials(event.studentName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{event.studentName}</p>
                    <p className="truncate text-xs text-muted-foreground">{event.className}</p>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                      SMS_TAG_STYLES[event.smsStatus],
                    )}
                  >
                    SMS {event.smsStatus}
                  </span>
                  <span className="w-14 shrink-0 text-right text-xs text-muted-foreground">
                    {formatRelativeTime(event.timestamp, now)}
                  </span>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
