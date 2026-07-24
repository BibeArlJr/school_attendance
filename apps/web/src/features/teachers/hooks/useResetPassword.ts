import { useMutation } from '@tanstack/react-query';
import { teachersApi } from '../api/teachersApi';

export function useResetPassword() {
  return useMutation({
    mutationFn: (id: string) => teachersApi.resetPassword(id),
  });
}
