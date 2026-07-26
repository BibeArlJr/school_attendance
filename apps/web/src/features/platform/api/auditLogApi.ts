import type { AuditLogActor, AuditLogEntry } from '../types/auditLog';
import { apiClient } from '@/shared/lib/apiClient';
import type { ApiSuccessResponse, PaginatedResponse } from '@/shared/types';

export interface AuditLogListParams {
  page?: number;
  per_page?: number;
  search?: string;
  school_id?: number;
  actor_user_id?: number;
  action?: string;
  date_from?: string;
  date_to?: string;
}

export const auditLogApi = {
  async list(params: AuditLogListParams): Promise<PaginatedResponse<AuditLogEntry>> {
    const { data } = await apiClient.get<ApiSuccessResponse<PaginatedResponse<AuditLogEntry>>>(
      '/platform/audit-log',
      { params },
    );
    return data.data;
  },

  async actions(): Promise<string[]> {
    const { data } = await apiClient.get<ApiSuccessResponse<string[]>>('/platform/audit-log/actions');
    return data.data;
  },

  async actors(): Promise<AuditLogActor[]> {
    const { data } = await apiClient.get<ApiSuccessResponse<AuditLogActor[]>>('/platform/audit-log/actors');
    return data.data;
  },
};
