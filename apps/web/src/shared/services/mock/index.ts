import { MockGateFeedService } from './MockGateFeedService';
import { MockNotificationService } from './MockNotificationService';
import type { GateFeedService } from '@/features/gate-feed/types';
import type { INotificationService } from '@/features/notifications/types';
import { RealGateFeedService } from '@/shared/services/real/RealGateFeedService';

/**
 * Factory selecting the concrete service implementation. Consumers depend
 * only on the returned interface — see docs/architecture/service-pattern.md.
 */
export function getNotificationService(): INotificationService {
  const useMock = import.meta.env.VITE_USE_MOCK_NOTIFICATIONS !== 'false';

  if (!useMock) {
    throw new Error(
      'Real NotificationService is not implemented in Phase 1 — this is scaffolding only.',
    );
  }

  return new MockNotificationService();
}

export function getGateFeedService(): GateFeedService {
  const useMock = import.meta.env.VITE_USE_MOCK_GATE_FEED !== 'false';

  // Real scanning now exists (Phase 7) — this is the intended payoff of
  // the mock/real seam built in Phase 2. RealGateFeedService polls
  // GET /attendance/recent-events; flip VITE_USE_MOCK_GATE_FEED=false to
  // use it.
  return useMock ? new MockGateFeedService() : new RealGateFeedService();
}
