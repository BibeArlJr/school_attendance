import type { GateEvent } from '@/shared/types';

/**
 * Reference: mock-service pattern — see docs/architecture/service-pattern.md.
 * Represents the live feed of gate-scanner events (student entry/exit
 * scans). No physical scanner integration exists yet (Gate Scanner ships
 * in Phase 5) — this interface is the seam a real implementation will
 * satisfy later.
 */
export interface GateFeedService {
  /** Subscribe to new gate events as they occur. Returns an unsubscribe function. */
  subscribe(onEvent: (event: GateEvent) => void): () => void;
}
