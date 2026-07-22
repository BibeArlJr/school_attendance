import axios from 'axios';
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
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      useAuthStore.getState().logout();
      if (window.location.pathname !== ROUTES.LOGIN) {
        window.location.href = ROUTES.LOGIN;
      }
    }
    return Promise.reject(error);
  },
);
