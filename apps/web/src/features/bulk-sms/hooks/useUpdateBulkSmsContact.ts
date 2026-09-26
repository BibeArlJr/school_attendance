import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { bulkSmsContactsApi } from '../api/bulkSmsContactsApi';
import type { BulkSmsContactFormValues } from '../schema';

export function useUpdateBulkSmsContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ uuid, values }: { uuid: string; values: BulkSmsContactFormValues }) =>
      bulkSmsContactsApi.update(uuid, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bulk-sms', 'contacts'] });
      toast.success('Contact updated.');
    },
  });
}
