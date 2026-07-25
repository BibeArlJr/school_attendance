import axios, { type InternalAxiosRequestConfig } from 'axios';
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

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

// A single in-flight refresh is shared across every request that 401s
// concurrently — without this, N requests failing at once would each fire
// their own POST /auth/refresh, racing to rotate the same refresh token
// (only the first would succeed, the rest would invalidate it out from
// under each other).
let refreshPromise: Promise<string | null> | null = null;

function refreshAccessToken(): Promise<string | null> {
  refreshPromise ??= (async () => {
    // Lazy import: authApi -> apiClient would otherwise be a circular
    // import at module-eval time.
    const { authApi } = await import('@/features/auth/api/authApi');
    const { refreshToken } = useAuthStore.getState();
    if (!refreshToken) return null;

    try {
      const result = await authApi.refresh(refreshToken);
      useAuthStore.getState().setTokens(result.token, result.refresh_token, result.expires_at);
      return result.token;
    } catch {
      return null;
    }
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

function forceLogout() {
  useAuthStore.getState().logout();
  if (window.location.pathname !== ROUTES.LOGIN) {
    window.location.href = ROUTES.LOGIN;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (axios.isAxiosError(error)) {
      // 401 = not authenticated (token missing/invalid/expired). Try one
      // silent refresh before forcing logout (Prompt 31 Part A) — only
      // once per request, guarded by `_retry`, so a request that still
      // 401s after a genuinely successful refresh doesn't loop forever.
      if (error.response?.status === 401) {
        const config = error.config as RetriableConfig | undefined;

        if (config && !config._retry) {
          config._retry = true;
          const newToken = await refreshAccessToken();
          if (newToken) {
            config.headers.Authorization = `Bearer ${newToken}`;
            return apiClient(config);
          }
        }

        forceLogout();
      } else if (error.response?.status === 403) {
        // 403 = authenticated but not permitted -> stay logged in, just
        // surface it. Calling code can additionally render ForbiddenState
        // inline where that's meaningful.
        //
        // license_expired (Prompt 25 Part C) is the one 403 that carries
        // a specific, actionable message ("subscription expired, contact
        // your administrator") rather than a generic permissions denial
        // — shown verbatim instead of the generic fallback below.
        const data = error.response.data as { message?: string; errors?: { code?: string } } | undefined;
        if (data?.errors?.code === 'license_expired' && data.message) {
          toast.error(data.message);
        } else {
          toast.error("You don't have permission to do that.");
        }
      }
    }
    return Promise.reject(error);
  },
);
