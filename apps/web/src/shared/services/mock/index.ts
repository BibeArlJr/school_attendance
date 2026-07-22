import { MockNotificationService } from './MockNotificationService';
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
