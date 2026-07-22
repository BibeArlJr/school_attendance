import type { IdCard } from '@/features/idcards/types';
import { apiClient } from '@/shared/lib/apiClient';
import type { ApiSuccessResponse } from '@/shared/types';

export const teacherIdCardApi = {
  async get(teacherId: number): Promise<IdCard> {
    const { data } = await apiClient.get<ApiSuccessResponse<IdCard>>(`/teachers/${teacherId}/id-card`);
    return data.data;
  },

  async reissue(teacherId: number): Promise<IdCard> {
    const { data } = await apiClient.post<ApiSuccessResponse<IdCard>>(
      `/teachers/${teacherId}/id-card/reissue`,
    );
    return data.data;
  },
};
