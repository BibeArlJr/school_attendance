import { useMutation } from '@tanstack/react-query';
import { bulkSmsCredentialApi } from '../api/bulkSmsCredentialApi';

// A mutation, not a query — this is an explicit, on-demand "Check
// Connection"/"Check Credits" action (both call this same read-only
// endpoint), never auto-fetched on page load.
export function useBulkSmsCredits() {
  return useMutation({
    mutationFn: () => bulkSmsCredentialApi.credits(),
  });
}
