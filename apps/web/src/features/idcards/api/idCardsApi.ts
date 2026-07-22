import type { IdCard } from '../types';
import { apiClient } from '@/shared/lib/apiClient';
import type { ApiSuccessResponse, PaginatedResponse } from '@/shared/types';

export interface IdCardListParams {
  page?: number;
  per_page?: number;
  search?: string;
}

export const idCardsApi = {
  async list(params: IdCardListParams): Promise<PaginatedResponse<IdCard>> {
    const { data } = await apiClient.get<ApiSuccessResponse<PaginatedResponse<IdCard>>>('/id-cards', {
      params,
    });
    return data.data;
  },

  async getForStudent(studentId: number): Promise<IdCard> {
    const { data } = await apiClient.get<ApiSuccessResponse<IdCard>>(`/students/${studentId}/id-card`);
    return data.data;
  },

  async reissue(studentId: number): Promise<IdCard> {
    const { data } = await apiClient.post<ApiSuccessResponse<IdCard>>(
      `/students/${studentId}/id-card/reissue`,
    );
    return data.data;
  },
};
