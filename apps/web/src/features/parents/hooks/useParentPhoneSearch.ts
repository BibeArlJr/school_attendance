import { useQuery } from '@tanstack/react-query';
import { parentsApi } from '../api/parentsApi';

// Minimum digits before searching — avoids firing a query (and showing a
// "no match" state) on every single keystroke from an empty field.
const MIN_PHONE_LENGTH = 3;

export function useParentPhoneSearch(phone: string) {
  const trimmed = phone.trim();

  return useQuery({
    queryKey: ['parents', 'search', trimmed],
    queryFn: () => parentsApi.searchByPhone(trimmed),
    enabled: trimmed.length >= MIN_PHONE_LENGTH,
  });
}
