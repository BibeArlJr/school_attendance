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
      // guard's actual job happens at the gate, not the dashboard — land
      // them straight on Gate Scanner (whose own input already
      // autofocuses) instead of a dashboard they'd immediately have to
      // navigate away from. Every other role's default is unchanged.
      navigate(result.user.role === 'guard' ? ROUTES.GATE_SCANNER : ROUTES.DASHBOARD);
    },
  });
}
