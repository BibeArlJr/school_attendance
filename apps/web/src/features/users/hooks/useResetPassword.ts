import { useMutation } from '@tanstack/react-query';
import { usersApi } from '../api/usersApi';

export function useResetPassword() {
  return useMutation({
    mutationFn: (id: string) => usersApi.resetPassword(id),
  });
}
