import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { useAuthStore } from '../store/authStore';
import { ROUTES } from '@/app/router/routes';

export function useLogin() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (result) => {
      login(result.user, result.token, result.refresh_token, result.expires_at);
      navigate(ROUTES.DASHBOARD);
    },
  });
}
