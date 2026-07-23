import type { TeacherFormValues } from '../schema';
import type { EmploymentStatus, Teacher } from '../types';
import { apiClient } from '@/shared/lib/apiClient';
import type { ApiSuccessResponse, PaginatedResponse } from '@/shared/types';

export interface TeacherListParams {
  page?: number;
  per_page?: number;
  search?: string;
  employment_status?: string;
}

export const teachersApi = {
  async list(params: TeacherListParams): Promise<PaginatedResponse<Teacher>> {
    const { data } = await apiClient.get<ApiSuccessResponse<PaginatedResponse<Teacher>>>('/teachers', {
      params,
    });
    return data.data;
  },

  async get(id: number): Promise<Teacher> {
    const { data } = await apiClient.get<ApiSuccessResponse<Teacher>>(`/teachers/${id}`);
    return data.data;
  },

  async create(values: TeacherFormValues): Promise<{ teacher: Teacher; temporary_password: string }> {
    const { data } = await apiClient.post<
      ApiSuccessResponse<{ staff: Teacher; temporary_password: string }>
    >('/teachers', values);
    return { teacher: data.data.staff, temporary_password: data.data.temporary_password };
  },

  async update(id: number, values: TeacherFormValues): Promise<Teacher> {
    const { data } = await apiClient.put<ApiSuccessResponse<Teacher>>(`/teachers/${id}`, values);
    return data.data;
  },

  async updateEmploymentStatus(id: number, employmentStatus: EmploymentStatus): Promise<Teacher> {
    const { data } = await apiClient.patch<ApiSuccessResponse<Teacher>>(
      `/teachers/${id}/employment-status`,
      { employment_status: employmentStatus },
    );
    return data.data;
  },

  async resetPassword(id: number): Promise<string> {
    const { data } = await apiClient.post<ApiSuccessResponse<{ temporary_password: string }>>(
      `/teachers/${id}/reset-password`,
    );
    return data.data.temporary_password;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/teachers/${id}`);
  },
};
