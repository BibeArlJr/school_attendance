import type { SmsCredits, SmsLog } from '../types';
import { apiClient } from '@/shared/lib/apiClient';
import type { ApiSuccessResponse, PaginatedResponse } from '@/shared/types';

export interface SmsLogListParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
}

export const smsApi = {
  async list(params: SmsLogListParams): Promise<PaginatedResponse<SmsLog>> {
    const { data } = await apiClient.get<ApiSuccessResponse<PaginatedResponse<SmsLog>>>('/sms-logs', {
      params,
    });
    return data.data;
  },

  async credits(): Promise<SmsCredits> {
    const { data } = await apiClient.get<ApiSuccessResponse<SmsCredits>>('/sms/credits');
    return data.data;
  },
};
