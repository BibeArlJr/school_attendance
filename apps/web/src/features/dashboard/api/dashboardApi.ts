import type { DashboardSummary } from '../types';
import { apiClient } from '@/shared/lib/apiClient';
import type { ApiSuccessResponse, AttendanceTrendPoint } from '@/shared/types';

export const dashboardApi = {
  async getSummary(): Promise<DashboardSummary> {
    const { data } =
      await apiClient.get<ApiSuccessResponse<DashboardSummary>>('/dashboard/summary');
    return data.data;
  },

  async getAttendanceTrend(): Promise<AttendanceTrendPoint[]> {
    const { data } = await apiClient.get<ApiSuccessResponse<AttendanceTrendPoint[]>>(
      '/dashboard/attendance-trend',
    );
    return data.data;
  },
};
