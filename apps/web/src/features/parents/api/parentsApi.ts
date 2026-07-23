import type { AddGuardianFormValues } from '../schema';
import type { ParentFormValues } from '../schema';
import type { ParentGuardian, StudentGuardianLink } from '../types';
import { apiClient } from '@/shared/lib/apiClient';
import type { ApiSuccessResponse, PaginatedResponse } from '@/shared/types';

export interface ParentListParams {
  page?: number;
  per_page?: number;
  search?: string;
}

export const parentsApi = {
  async list(params: ParentListParams): Promise<PaginatedResponse<ParentGuardian>> {
    const { data } = await apiClient.get<ApiSuccessResponse<PaginatedResponse<ParentGuardian>>>('/parents', {
      params,
    });
    return data.data;
  },

  async get(id: number): Promise<ParentGuardian> {
    const { data } = await apiClient.get<ApiSuccessResponse<ParentGuardian>>(`/parents/${id}`);
    return data.data;
  },

  async create(values: ParentFormValues): Promise<ParentGuardian> {
    const { data } = await apiClient.post<ApiSuccessResponse<ParentGuardian>>('/parents', values);
    return data.data;
  },

  async update(id: number, values: ParentFormValues): Promise<ParentGuardian> {
    const { data } = await apiClient.put<ApiSuccessResponse<ParentGuardian>>(`/parents/${id}`, values);
    return data.data;
  },

  async searchByPhone(phone: string): Promise<ParentGuardian | null> {
    const { data } = await apiClient.get<ApiSuccessResponse<ParentGuardian | null>>('/parents/search', {
      params: { phone },
    });
    return data.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/parents/${id}`);
  },
};

export const studentGuardiansApi = {
  async list(studentId: number): Promise<StudentGuardianLink[]> {
    const { data } = await apiClient.get<ApiSuccessResponse<StudentGuardianLink[]>>(
      `/students/${studentId}/parents`,
    );
    return data.data;
  },

  async link(
    studentId: number,
    values: AddGuardianFormValues & { parent_id?: number; phone?: string },
  ): Promise<StudentGuardianLink> {
    const { data } = await apiClient.post<ApiSuccessResponse<StudentGuardianLink>>(
      `/students/${studentId}/parents`,
      values,
    );
    return data.data;
  },

  async unlink(studentId: number, parentId: number): Promise<void> {
    await apiClient.delete(`/students/${studentId}/parents/${parentId}`);
  },
};
