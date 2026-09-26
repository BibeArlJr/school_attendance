import { useMutation } from '@tanstack/react-query';
import { bulkSmsTestSendApi } from '../api/bulkSmsTestSendApi';

export function useSendTestSms() {
  return useMutation({
    mutationFn: ({ phone, message }: { phone: string; message: string }) => bulkSmsTestSendApi.send(phone, message),
  });
}
