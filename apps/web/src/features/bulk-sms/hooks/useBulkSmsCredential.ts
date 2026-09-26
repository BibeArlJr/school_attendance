import { useQuery } from '@tanstack/react-query';
import { bulkSmsCredentialApi } from '../api/bulkSmsCredentialApi';

export function useBulkSmsCredential() {
  return useQuery({
    queryKey: ['bulk-sms', 'credential'],
    queryFn: () => bulkSmsCredentialApi.get(),
  });
}
