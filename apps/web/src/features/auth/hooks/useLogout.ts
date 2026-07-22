import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { useAuthStore } from '../store/authStore';
import { ROUTES } from '@/app/router/routes';

export function useLogout() {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      // Clear the local session even if the network call fails — the user
      // still expects to be logged out client-side.
      logout();
      navigate(ROUTES.LOGIN);
    },
  });
}
