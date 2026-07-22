import { toast } from 'sonner';
import type { INotificationService } from '@/features/notifications/types';

export class MockNotificationService implements INotificationService {
  async notify(message: string): Promise<void> {
    console.info('[MockNotificationService]', message);
    toast(message);
  }
}
