import type { AttendanceSummaryRow, EnrollmentSummary } from '../types';
import { apiClient } from '@/shared/lib/apiClient';
import type { ApiSuccessResponse } from '@/shared/types';

export interface AttendanceSummaryParams {
  from?: string;
  to?: string;
  class_id?: number;
}

export interface EnrollmentSummaryParams {
  class_id?: number;
}

export const reportsApi = {
  async attendanceSummary(params: AttendanceSummaryParams): Promise<AttendanceSummaryRow[]> {
    const { data } = await apiClient.get<ApiSuccessResponse<AttendanceSummaryRow[]>>(
      '/reports/attendance-summary',
      { params },
    );
    return data.data;
  },

  async enrollmentSummary(params: EnrollmentSummaryParams): Promise<EnrollmentSummary> {
    const { data } = await apiClient.get<ApiSuccessResponse<EnrollmentSummary>>(
      '/reports/enrollment-summary',
      { params },
    );
    return data.data;
  },
};
