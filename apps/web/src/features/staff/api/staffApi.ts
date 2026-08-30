import type { StaffFormValues } from '../schema';
import type { Staff, StaffEmploymentStatus } from '../types';
import { apiClient } from '@/shared/lib/apiClient';
import type { ApiSuccessResponse, PaginatedResponse } from '@/shared/types';

export interface StaffListParams {
  page?: number;
  per_page?: number;
  search?: string;
  employment_status?: string;
}

export const staffApi = {
  async list(params: StaffListParams): Promise<PaginatedResponse<Staff>> {
    const { data } = await apiClient.get<ApiSuccessResponse<PaginatedResponse<Staff>>>('/staff', {
      params,
    });
    return data.data;
  },

  async get(uuid: string): Promise<Staff> {
    const { data } = await apiClient.get<ApiSuccessResponse<Staff>>(`/staff/${uuid}`);
    return data.data;
  },

  async create(values: StaffFormValues): Promise<Staff> {
    const { data } = await apiClient.post<ApiSuccessResponse<Staff>>('/staff', values);
    return data.data;
  },

  async update(uuid: string, values: StaffFormValues): Promise<Staff> {
    const { data } = await apiClient.put<ApiSuccessResponse<Staff>>(`/staff/${uuid}`, values);
    return data.data;
  },

  async updateEmploymentStatus(uuid: string, employmentStatus: StaffEmploymentStatus): Promise<Staff> {
    const { data } = await apiClient.patch<ApiSuccessResponse<Staff>>(
      `/staff/${uuid}/employment-status`,
      { employment_status: employmentStatus },
    );
    return data.data;
  },

  // Blocked (422, DeleteBlockedException) if this staff member has real
  // attendance history — use employment status instead, same convention
  // as UserAccount's delete guard.
  async delete(uuid: string): Promise<void> {
    await apiClient.delete(`/staff/${uuid}`);
  },
};
