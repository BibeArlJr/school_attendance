import type { CreateSchoolResult, PlatformSchool } from '../types';
import type { SchoolSummary } from '@/features/auth/types';
import { apiClient } from '@/shared/lib/apiClient';
import type { ApiSuccessResponse } from '@/shared/types';

export interface CreateSchoolInput {
  school_code: string;
  name: string;
  contact_email?: string;
  contact_phone?: string;
  admin_name: string;
  admin_email: string;
}

export const platformApi = {
  async listSchools(): Promise<PlatformSchool[]> {
    const { data } = await apiClient.get<ApiSuccessResponse<PlatformSchool[]>>('/platform/schools');
    return data.data;
  },

  async createSchool(values: CreateSchoolInput): Promise<CreateSchoolResult> {
    const { data } = await apiClient.post<ApiSuccessResponse<CreateSchoolResult>>(
      '/platform/schools',
      values,
    );
    return data.data;
  },

  async setActiveSchool(schoolId: number): Promise<SchoolSummary> {
    const { data } = await apiClient.post<ApiSuccessResponse<SchoolSummary>>(
      '/platform/active-school',
      { school_id: schoolId },
    );
    return data.data;
  },

  async activateSubscription(schoolId: number): Promise<PlatformSchool> {
    const { data } = await apiClient.post<ApiSuccessResponse<PlatformSchool>>(
      `/platform/schools/${schoolId}/activate-subscription`,
    );
    return data.data;
  },
};
