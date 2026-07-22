import axios from 'axios';
import { toast } from 'sonner';
import { ROUTES } from '@/app/router/routes';
import { useAuthStore } from '@/features/auth/store/authStore';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api',
  headers: {
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      // 401 = not authenticated (token missing/invalid/expired) -> log out.
      if (error.response?.status === 401) {
        useAuthStore.getState().logout();
        if (window.location.pathname !== ROUTES.LOGIN) {
          window.location.href = ROUTES.LOGIN;
        }
      } else if (error.response?.status === 403) {
        // 403 = authenticated but not permitted -> stay logged in, just
        // surface it. Calling code can additionally render ForbiddenState
        // inline where that's meaningful.
        toast.error("You don't have permission to do that.");
      }
    }
    return Promise.reject(error);
  },
);
