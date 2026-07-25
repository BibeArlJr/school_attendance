import type { StaffFormValues } from '../schema';
import type { EmploymentStatus, Staff } from '../types';
import { apiClient } from '@/shared/lib/apiClient';
import type { ApiSuccessResponse, PaginatedResponse } from '@/shared/types';

export interface StaffListParams {
  page?: number;
  per_page?: number;
  search?: string;
  employment_status?: string;
  role?: string;
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

  async create(values: StaffFormValues): Promise<{ staff: Staff; temporary_password: string }> {
    const { data } = await apiClient.post<
      ApiSuccessResponse<{ staff: Staff; temporary_password: string }>
    >('/staff', values);
    return { staff: data.data.staff, temporary_password: data.data.temporary_password };
  },

  async update(uuid: string, values: StaffFormValues): Promise<Staff> {
    const { data } = await apiClient.put<ApiSuccessResponse<Staff>>(`/staff/${uuid}`, values);
    return data.data;
  },

  async updateEmploymentStatus(uuid: string, employmentStatus: EmploymentStatus): Promise<Staff> {
    const { data } = await apiClient.patch<ApiSuccessResponse<Staff>>(
      `/staff/${uuid}/employment-status`,
      { employment_status: employmentStatus },
    );
    return data.data;
  },

  async resetPassword(uuid: string): Promise<string> {
    const { data } = await apiClient.post<ApiSuccessResponse<{ temporary_password: string }>>(
      `/staff/${uuid}/reset-password`,
    );
    return data.data.temporary_password;
  },

  async delete(uuid: string): Promise<void> {
    await apiClient.delete(`/staff/${uuid}`);
  },
};
