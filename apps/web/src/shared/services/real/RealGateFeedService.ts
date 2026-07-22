import type { GateFeedService } from '@/features/gate-feed/types';
import { apiClient } from '@/shared/lib/apiClient';
import type { ApiSuccessResponse, GateEvent } from '@/shared/types';

// Polling, not push — GET /attendance/recent-events has no live-push
// counterpart (no websockets in this stack), so "live" here means "checked
// often enough to feel live." Proves the mock/real seam from Phase 2
// actually works: same GateFeedService interface, same useGateFeed
// consumer, zero changes to either.
const POLL_INTERVAL_MS = 3000;

export class RealGateFeedService implements GateFeedService {
  private seenIds = new Set<string>();
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private readonly listeners = new Set<(event: GateEvent) => void>();
  private primed = false;

  subscribe(onEvent: (event: GateEvent) => void): () => void {
    this.listeners.add(onEvent);
    this.ensurePolling();

    return () => {
      this.listeners.delete(onEvent);
      if (this.listeners.size === 0) {
        this.stop();
      }
    };
  }

  private ensurePolling(): void {
    if (this.intervalId !== null) {
      return;
    }
    void this.poll();
    this.intervalId = setInterval(() => void this.poll(), POLL_INTERVAL_MS);
  }

  private stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async poll(): Promise<void> {
    const { data } = await apiClient.get<ApiSuccessResponse<GateEvent[]>>('/attendance/recent-events');
    const events = data.data;

    if (!this.primed) {
      // First poll after mount: record what already exists without
      // emitting it, so the feed starts from "now" rather than replaying
      // all of today's history at once.
      events.forEach((event) => this.seenIds.add(event.id));
      this.primed = true;
      return;
    }

    // Oldest first, so listeners receive them in chronological order.
    events
      .filter((event) => !this.seenIds.has(event.id))
      .reverse()
      .forEach((event) => {
        this.seenIds.add(event.id);
        this.listeners.forEach((listener) => listener(event));
      });
  }
}
