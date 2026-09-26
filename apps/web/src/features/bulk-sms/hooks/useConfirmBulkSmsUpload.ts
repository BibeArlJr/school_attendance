import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bulkSmsUploadApi } from '../api/bulkSmsUploadApi';
import type { BulkSmsUploadConfirmRow } from '../types';

export function useConfirmBulkSmsUpload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ fileName, rows }: { fileName: string; rows: BulkSmsUploadConfirmRow[] }) =>
      bulkSmsUploadApi.confirm(fileName, rows),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bulk-sms', 'contacts'] });
      void queryClient.invalidateQueries({ queryKey: ['bulk-sms', 'uploads'] });
    },
  });
}
