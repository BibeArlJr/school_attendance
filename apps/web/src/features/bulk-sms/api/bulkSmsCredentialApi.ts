import type { BulkSmsCredits, BulkSmsProviderConfigInfo } from '../types';
import { apiClient } from '@/shared/lib/apiClient';
import type { ApiSuccessResponse } from '@/shared/types';

export const bulkSmsCredentialApi = {
  async get(): Promise<BulkSmsProviderConfigInfo> {
    const { data } = await apiClient.get<ApiSuccessResponse<BulkSmsProviderConfigInfo>>('/bulk-sms/credential');
    return data.data;
  },

  async update(token: string, senderId: string): Promise<BulkSmsProviderConfigInfo> {
    const { data } = await apiClient.put<ApiSuccessResponse<BulkSmsProviderConfigInfo>>('/bulk-sms/credential', {
      token,
      sender_id: senderId,
    });
    return data.data;
  },

  // Backs both "Check Connection" and "Check Credits" — same read-only
  // call either way, never an SMS send under any driver mode.
  async credits(): Promise<BulkSmsCredits> {
    const { data } = await apiClient.get<ApiSuccessResponse<BulkSmsCredits>>('/bulk-sms/credential/credits');
    return data.data;
  },
};
