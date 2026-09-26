import type { BulkSmsContactFormValues } from '../schema';
import type { BulkSmsContact } from '../types';
import { apiClient } from '@/shared/lib/apiClient';
import type { ApiSuccessResponse, PaginatedResponse } from '@/shared/types';

export interface BulkSmsContactListParams {
  page?: number;
  per_page?: number;
  search?: string;
}

export const bulkSmsContactsApi = {
  async list(params: BulkSmsContactListParams): Promise<PaginatedResponse<BulkSmsContact>> {
    const { data } = await apiClient.get<ApiSuccessResponse<PaginatedResponse<BulkSmsContact>>>(
      '/bulk-sms/contacts',
      { params },
    );
    return data.data;
  },

  async create(values: BulkSmsContactFormValues): Promise<BulkSmsContact> {
    const { data } = await apiClient.post<ApiSuccessResponse<BulkSmsContact>>('/bulk-sms/contacts', values);
    return data.data;
  },

  async update(uuid: string, values: BulkSmsContactFormValues): Promise<BulkSmsContact> {
    const { data } = await apiClient.put<ApiSuccessResponse<BulkSmsContact>>(
      `/bulk-sms/contacts/${uuid}`,
      values,
    );
    return data.data;
  },

  async delete(uuid: string): Promise<void> {
    await apiClient.delete(`/bulk-sms/contacts/${uuid}`);
  },
};
