import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { bulkSmsContactsApi } from '../api/bulkSmsContactsApi';

export function useDeleteBulkSmsContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (uuid: string) => bulkSmsContactsApi.delete(uuid),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bulk-sms', 'contacts'] });
      toast.success('Contact deleted.');
    },
  });
}
