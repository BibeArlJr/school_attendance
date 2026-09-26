import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { bulkSmsUploadApi } from '../api/bulkSmsUploadApi';

export function useBulkSmsUploads(params: { page?: number; per_page?: number }) {
  return useQuery({
    queryKey: ['bulk-sms', 'uploads', params],
    queryFn: () => bulkSmsUploadApi.list(params),
    placeholderData: keepPreviousData,
  });
}
