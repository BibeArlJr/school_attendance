import type { DashboardSummary } from '../types';
import { apiClient } from '@/shared/lib/apiClient';
import type { ApiSuccessResponse } from '@/shared/types';

export const dashboardApi = {
  async getSummary(): Promise<DashboardSummary> {
    const { data } =
      await apiClient.get<ApiSuccessResponse<DashboardSummary>>('/dashboard/summary');
    return data.data;
  },
};
