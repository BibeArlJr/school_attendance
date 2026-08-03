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
  admin_phone?: string;
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

  /**
   * `days` parameterizes the quick-duration buttons (+7/+30/+90/+365 —
   * Prompt 26 Part C revision); omitted entirely defaults to the
   * original 365-day "Activate Subscription" behavior server-side.
   */
  async extendSubscription(schoolId: number, days?: number): Promise<PlatformSchool> {
    const { data } = await apiClient.post<ApiSuccessResponse<PlatformSchool>>(
      `/platform/schools/${schoolId}/activate-subscription`,
      days ? { days } : undefined,
    );
    return data.data;
  },

  /** Manual override — sets amc_expiry_date literally, including a date
   *  earlier than the current one (shortening an active subscription). */
  async setSubscriptionExpiry(schoolId: number, amcExpiryDate: string): Promise<PlatformSchool> {
    const { data } = await apiClient.put<ApiSuccessResponse<PlatformSchool>>(
      `/platform/schools/${schoolId}/subscription-expiry`,
      { amc_expiry_date: amcExpiryDate },
    );
    return data.data;
  },

  async cancelSubscription(schoolId: number): Promise<PlatformSchool> {
    const { data } = await apiClient.post<ApiSuccessResponse<PlatformSchool>>(
      `/platform/schools/${schoolId}/cancel-subscription`,
    );
    return data.data;
  },

  /** Orthogonal to the subscription actions above (Prompt 35 Part E) —
   *  blocks 100% of login for this school, not just write access. */
  async deactivateSchool(schoolId: number): Promise<PlatformSchool> {
    const { data } = await apiClient.post<ApiSuccessResponse<PlatformSchool>>(
      `/platform/schools/${schoolId}/deactivate`,
    );
    return data.data;
  },

  async reactivateSchool(schoolId: number): Promise<PlatformSchool> {
    const { data } = await apiClient.post<ApiSuccessResponse<PlatformSchool>>(
      `/platform/schools/${schoolId}/reactivate`,
    );
    return data.data;
  },

  /** Real delete — only succeeds server-side when the school is already
   *  deactivated and has zero real students/staff on record (see
   *  PlatformSchoolService::destroy()). */
  async deleteSchool(schoolId: number): Promise<void> {
    await apiClient.delete(`/platform/schools/${schoolId}`);
  },
};
