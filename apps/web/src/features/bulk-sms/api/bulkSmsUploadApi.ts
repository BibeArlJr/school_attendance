import type { BulkSmsUpload, BulkSmsUploadConfirmResult, BulkSmsUploadConfirmRow, BulkSmsUploadPreviewResult } from '../types';
import { apiClient } from '@/shared/lib/apiClient';
import type { ApiSuccessResponse, PaginatedResponse } from '@/shared/types';

export const bulkSmsUploadApi = {
  /** Writes nothing server-side — see BulkSmsUploadService::preview(). */
  async preview(file: File): Promise<BulkSmsUploadPreviewResult> {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await apiClient.post<ApiSuccessResponse<BulkSmsUploadPreviewResult>>(
      '/bulk-sms/uploads/preview',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data.data;
  },

  async confirm(fileName: string, rows: BulkSmsUploadConfirmRow[]): Promise<BulkSmsUploadConfirmResult> {
    const { data } = await apiClient.post<ApiSuccessResponse<BulkSmsUploadConfirmResult>>(
      '/bulk-sms/uploads/confirm',
      { file_name: fileName, rows },
    );
    return data.data;
  },

  async list(params: { page?: number; per_page?: number }): Promise<PaginatedResponse<BulkSmsUpload>> {
    const { data } = await apiClient.get<ApiSuccessResponse<PaginatedResponse<BulkSmsUpload>>>(
      '/bulk-sms/uploads',
      { params },
    );
    return data.data;
  },
};
