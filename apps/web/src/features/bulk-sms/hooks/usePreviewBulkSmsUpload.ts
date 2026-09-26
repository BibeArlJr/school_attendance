import { useMutation } from '@tanstack/react-query';
import { bulkSmsUploadApi } from '../api/bulkSmsUploadApi';

export function usePreviewBulkSmsUpload() {
  return useMutation({
    mutationFn: (file: File) => bulkSmsUploadApi.preview(file),
  });
}
