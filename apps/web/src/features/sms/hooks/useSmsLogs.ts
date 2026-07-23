import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { smsApi, type SmsLogListParams } from '../api/smsApi';

export function useSmsLogs(params: SmsLogListParams) {
  return useQuery({
    queryKey: ['sms-logs', params],
    queryFn: () => smsApi.list(params),
    placeholderData: keepPreviousData,
  });
}
