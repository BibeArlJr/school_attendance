import { useQuery } from '@tanstack/react-query';
import { smsApi } from '../api/smsApi';

export function useSmsCredits() {
  return useQuery({
    queryKey: ['sms-credits'],
    queryFn: () => smsApi.credits(),
  });
}
