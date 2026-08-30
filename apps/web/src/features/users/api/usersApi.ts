import type { UserAccountFormValues } from '../schema';
import type { EmploymentStatus, UserAccount } from '../types';
import { apiClient } from '@/shared/lib/apiClient';
import type { ApiSuccessResponse, PaginatedResponse } from '@/shared/types';

export interface UserAccountListParams {
  page?: number;
  per_page?: number;
  search?: string;
  employment_status?: string;
  role?: string;
}

export const usersApi = {
  async list(params: UserAccountListParams): Promise<PaginatedResponse<UserAccount>> {
    const { data } = await apiClient.get<ApiSuccessResponse<PaginatedResponse<UserAccount>>>('/users', {
      params,
    });
    return data.data;
  },

  async get(uuid: string): Promise<UserAccount> {
    const { data } = await apiClient.get<ApiSuccessResponse<UserAccount>>(`/users/${uuid}`);
    return data.data;
  },

  async create(values: UserAccountFormValues): Promise<{ staff: UserAccount; temporary_password: string }> {
    const { data } = await apiClient.post<
      ApiSuccessResponse<{ staff: UserAccount; temporary_password: string }>
    >('/users', values);
    return { staff: data.data.staff, temporary_password: data.data.temporary_password };
  },

  async update(uuid: string, values: UserAccountFormValues): Promise<UserAccount> {
    const { data } = await apiClient.put<ApiSuccessResponse<UserAccount>>(`/users/${uuid}`, values);
    return data.data;
  },

  async updateEmploymentStatus(uuid: string, employmentStatus: EmploymentStatus): Promise<UserAccount> {
    const { data } = await apiClient.patch<ApiSuccessResponse<UserAccount>>(
      `/users/${uuid}/employment-status`,
      { employment_status: employmentStatus },
    );
    return data.data;
  },

  async resetPassword(uuid: string): Promise<string> {
    const { data } = await apiClient.post<ApiSuccessResponse<{ temporary_password: string }>>(
      `/users/${uuid}/reset-password`,
    );
    return data.data.temporary_password;
  },

  async delete(uuid: string): Promise<void> {
    await apiClient.delete(`/users/${uuid}`);
  },
};
