import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { bulkSmsCredentialApi } from '../api/bulkSmsCredentialApi';

export function useUpdateBulkSmsCredential() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ token, senderId }: { token: string; senderId: string }) =>
      bulkSmsCredentialApi.update(token, senderId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bulk-sms', 'credential'] });
      toast.success('Bulk SMS credential saved.');
    },
  });
}
