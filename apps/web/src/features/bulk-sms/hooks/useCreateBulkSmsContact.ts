import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { bulkSmsContactsApi } from '../api/bulkSmsContactsApi';

export function useCreateBulkSmsContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bulkSmsContactsApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bulk-sms', 'contacts'] });
      toast.success('Contact added.');
    },
  });
}
