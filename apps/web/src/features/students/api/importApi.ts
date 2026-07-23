import type { ImportBatch, ImportCommitResult, ImportRowDecision } from '../types/import';
import { apiClient } from '@/shared/lib/apiClient';
import type { ApiSuccessResponse } from '@/shared/types';

export const importApi = {
  async upload(file: File): Promise<ImportBatch> {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await apiClient.post<ApiSuccessResponse<ImportBatch>>('/students/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },

  async get(batchId: number): Promise<ImportBatch> {
    const { data } = await apiClient.get<ApiSuccessResponse<ImportBatch>>(`/students/import/${batchId}`);
    return data.data;
  },

  async commit(batchId: number, rows: ImportRowDecision[]): Promise<ImportCommitResult> {
    const { data } = await apiClient.post<ApiSuccessResponse<ImportCommitResult>>(
      `/students/import/${batchId}/commit`,
      { rows },
    );
    return data.data;
  },
};
