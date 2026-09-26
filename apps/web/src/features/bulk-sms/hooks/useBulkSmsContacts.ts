import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { bulkSmsContactsApi, type BulkSmsContactListParams } from '../api/bulkSmsContactsApi';

export function useBulkSmsContacts(params: BulkSmsContactListParams) {
  return useQuery({
    queryKey: ['bulk-sms', 'contacts', params],
    queryFn: () => bulkSmsContactsApi.list(params),
    placeholderData: keepPreviousData,
  });
}
