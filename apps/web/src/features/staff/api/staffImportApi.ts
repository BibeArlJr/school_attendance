import type {
  StaffImportBatch,
  StaffImportCommitResult,
  StaffImportRowDecision,
} from '../types/import';
import { apiClient } from '@/shared/lib/apiClient';
import type { ApiSuccessResponse } from '@/shared/types';

export const staffImportApi = {
  async upload(file: File): Promise<StaffImportBatch> {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await apiClient.post<ApiSuccessResponse<StaffImportBatch>>(
      '/staff/import',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data.data;
  },

  async get(batchId: number): Promise<StaffImportBatch> {
    const { data } = await apiClient.get<ApiSuccessResponse<StaffImportBatch>>(
      `/staff/import/${batchId}`,
    );
    return data.data;
  },

  async commit(batchId: number, rows: StaffImportRowDecision[]): Promise<StaffImportCommitResult> {
    const { data } = await apiClient.post<ApiSuccessResponse<StaffImportCommitResult>>(
      `/staff/import/${batchId}/commit`,
      { rows },
    );
    return data.data;
  },
};
