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

  async get(uuid: string): Promise<ParentGuardian> {
    const { data } = await apiClient.get<ApiSuccessResponse<ParentGuardian>>(`/parents/${uuid}`);
    return data.data;
  },

  async create(values: ParentFormValues): Promise<ParentGuardian> {
    const { data } = await apiClient.post<ApiSuccessResponse<ParentGuardian>>('/parents', values);
    return data.data;
  },

  async update(uuid: string, values: ParentFormValues): Promise<ParentGuardian> {
    const { data } = await apiClient.put<ApiSuccessResponse<ParentGuardian>>(`/parents/${uuid}`, values);
    return data.data;
  },

  async searchByPhone(phone: string): Promise<ParentGuardian | null> {
    const { data } = await apiClient.get<ApiSuccessResponse<ParentGuardian | null>>('/parents/search', {
      params: { phone },
    });
    return data.data;
  },

  async delete(uuid: string): Promise<void> {
    await apiClient.delete(`/parents/${uuid}`);
  },
};

export const studentGuardiansApi = {
  async list(studentUuid: string): Promise<StudentGuardianLink[]> {
    const { data } = await apiClient.get<ApiSuccessResponse<StudentGuardianLink[]>>(
      `/students/${studentUuid}/parents`,
    );
    return data.data;
  },

  // `parent_id` (when present) is an existing ParentGuardian's internal
  // numeric id, not a route parameter — StoreStudentParentLinkRequest
  // validates it against parent_guardians.id directly and the backend
  // resolves it via a plain findOrFail(), never route-model binding, so
  // it stays a number even though the URL itself now needs the uuid.
  async link(
    studentUuid: string,
    values: AddGuardianFormValues & { parent_id?: number; phone?: string },
  ): Promise<StudentGuardianLink> {
    const { data } = await apiClient.post<ApiSuccessResponse<StudentGuardianLink>>(
      `/students/${studentUuid}/parents`,
      values,
    );
    return data.data;
  },

  async unlink(studentUuid: string, parentUuid: string): Promise<void> {
    await apiClient.delete(`/students/${studentUuid}/parents/${parentUuid}`);
  },
};
