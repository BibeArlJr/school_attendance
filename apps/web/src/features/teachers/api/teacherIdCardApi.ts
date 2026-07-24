import type { IdCard } from '@/features/idcards/types';
import { apiClient } from '@/shared/lib/apiClient';
import type { ApiSuccessResponse } from '@/shared/types';

export const teacherIdCardApi = {
  async get(teacherUuid: string): Promise<IdCard> {
    const { data } = await apiClient.get<ApiSuccessResponse<IdCard>>(`/teachers/${teacherUuid}/id-card`);
    return data.data;
  },

  async reissue(teacherUuid: string): Promise<IdCard> {
    const { data } = await apiClient.post<ApiSuccessResponse<IdCard>>(
      `/teachers/${teacherUuid}/id-card/reissue`,
    );
    return data.data;
  },
};
