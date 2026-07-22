import { MockGateFeedService } from './MockGateFeedService';
import { MockNotificationService } from './MockNotificationService';
import type { GateFeedService } from '@/features/gate-feed/types';
import type { INotificationService } from '@/features/notifications/types';

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

  if (!useMock) {
    throw new Error(
      'Real GateFeedService is not implemented — no physical gate scanner integration exists ' +
        'yet (see the Gate Scanner module, Phase 5). Set VITE_USE_MOCK_GATE_FEED=true to use the mock.',
    );
  }

  return new MockGateFeedService();
}
