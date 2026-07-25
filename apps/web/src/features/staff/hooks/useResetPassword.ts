import { useMutation } from '@tanstack/react-query';
import { staffApi } from '../api/staffApi';

export function useResetPassword() {
  return useMutation({
    mutationFn: (id: string) => staffApi.resetPassword(id),
  });
}
