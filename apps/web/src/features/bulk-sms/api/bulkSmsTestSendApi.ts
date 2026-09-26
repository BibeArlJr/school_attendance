import type { BulkSmsSendLog } from '../types';
import { apiClient } from '@/shared/lib/apiClient';
import type { ApiSuccessResponse } from '@/shared/types';

export const bulkSmsTestSendApi = {
  // Exactly one scalar phone string, one message string — nothing else.
  // Never a contact id, upload id, or any recipient list — see
  // TestSendBulkSmsRequest (backend) and BulkSmsTestSendSection (this
  // feature's own UI, which has no contact-picker of any kind).
  async send(phone: string, message: string): Promise<BulkSmsSendLog> {
    const { data } = await apiClient.post<ApiSuccessResponse<BulkSmsSendLog>>('/bulk-sms/test-send', {
      phone,
      message,
    });
    return data.data;
  },
};
