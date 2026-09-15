import type { IdCard } from '../types';
import { apiClient } from '@/shared/lib/apiClient';
import type { ApiSuccessResponse, PaginatedResponse } from '@/shared/types';

export interface IdCardListParams {
  page?: number;
  per_page?: number;
  search?: string;
  owner_type?: 'student' | 'staff';
  // Only applies to owner_type 'student' — Staff has no class concept
  // (same guard as AttendanceRecordListParams' class_id).
  class_id?: number;
}

export const idCardsApi = {
  async list(params: IdCardListParams): Promise<PaginatedResponse<IdCard>> {
    const { data } = await apiClient.get<ApiSuccessResponse<PaginatedResponse<IdCard>>>('/id-cards', {
      params,
    });
    return data.data;
  },

  async getForStudent(studentUuid: string): Promise<IdCard> {
    const { data } = await apiClient.get<ApiSuccessResponse<IdCard>>(`/students/${studentUuid}/id-card`);
    return data.data;
  },

  async reissue(studentUuid: string): Promise<IdCard> {
    const { data } = await apiClient.post<ApiSuccessResponse<IdCard>>(
      `/students/${studentUuid}/id-card/reissue`,
    );
    return data.data;
  },

  // Restored (Rebuild Staff Module Part G) — same shape as the student
  // pair above, hitting the staff-specific endpoints instead.
  async getForStaff(staffUuid: string): Promise<IdCard> {
    const { data } = await apiClient.get<ApiSuccessResponse<IdCard>>(`/staff/${staffUuid}/id-card`);
    return data.data;
  },

  async reissueForStaff(staffUuid: string): Promise<IdCard> {
    const { data } = await apiClient.post<ApiSuccessResponse<IdCard>>(
      `/staff/${staffUuid}/id-card/reissue`,
    );
    return data.data;
  },
};
