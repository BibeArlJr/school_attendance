import type { TeacherFormValues } from '../schema';
import type { EmploymentStatus, Teacher } from '../types';
import { apiClient } from '@/shared/lib/apiClient';
import type { ApiSuccessResponse, PaginatedResponse } from '@/shared/types';

export interface TeacherListParams {
  page?: number;
  per_page?: number;
  search?: string;
  employment_status?: string;
  role?: string;
}

export const teachersApi = {
  async list(params: TeacherListParams): Promise<PaginatedResponse<Teacher>> {
    const { data } = await apiClient.get<ApiSuccessResponse<PaginatedResponse<Teacher>>>('/teachers', {
      params,
    });
    return data.data;
  },

  async get(uuid: string): Promise<Teacher> {
    const { data } = await apiClient.get<ApiSuccessResponse<Teacher>>(`/teachers/${uuid}`);
    return data.data;
  },

  async create(values: TeacherFormValues): Promise<{ teacher: Teacher; temporary_password: string }> {
    const { data } = await apiClient.post<
      ApiSuccessResponse<{ staff: Teacher; temporary_password: string }>
    >('/teachers', values);
    return { teacher: data.data.staff, temporary_password: data.data.temporary_password };
  },

  async update(uuid: string, values: TeacherFormValues): Promise<Teacher> {
    const { data } = await apiClient.put<ApiSuccessResponse<Teacher>>(`/teachers/${uuid}`, values);
    return data.data;
  },

  async updateEmploymentStatus(uuid: string, employmentStatus: EmploymentStatus): Promise<Teacher> {
    const { data } = await apiClient.patch<ApiSuccessResponse<Teacher>>(
      `/teachers/${uuid}/employment-status`,
      { employment_status: employmentStatus },
    );
    return data.data;
  },

  async resetPassword(uuid: string): Promise<string> {
    const { data } = await apiClient.post<ApiSuccessResponse<{ temporary_password: string }>>(
      `/teachers/${uuid}/reset-password`,
    );
    return data.data.temporary_password;
  },

  async delete(uuid: string): Promise<void> {
    await apiClient.delete(`/teachers/${uuid}`);
  },
};
