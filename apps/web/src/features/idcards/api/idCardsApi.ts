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
};
