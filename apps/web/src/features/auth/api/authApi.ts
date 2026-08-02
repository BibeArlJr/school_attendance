import axios from 'axios';
import type { LoginFormValues } from '../schema';
import type { AuthUser, LoginResult, RefreshResult } from '../types';
import { apiClient } from '@/shared/lib/apiClient';
import type { ApiSuccessResponse } from '@/shared/types';

export const authApi = {
  async login(credentials: LoginFormValues): Promise<LoginResult> {
    const { data } = await apiClient.post<ApiSuccessResponse<LoginResult>>(
      '/auth/login',
      credentials,
    );
    return data.data;
  },

  /**
   * Deliberately a bare axios call, not `apiClient` — its request
   * interceptor always attaches the (possibly expired) access token as
   * Bearer, which would stomp on the refresh token this call needs to
   * send instead.
   */
  async refresh(refreshToken: string): Promise<RefreshResult> {
    const { data } = await axios.post<ApiSuccessResponse<RefreshResult>>(
      `${import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'}/auth/refresh`,
      undefined,
      { headers: { Authorization: `Bearer ${refreshToken}`, Accept: 'application/json' } },
    );
    return data.data;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  async me(): Promise<AuthUser> {
    const { data } = await apiClient.get<ApiSuccessResponse<AuthUser>>('/auth/me');
    return data.data;
  },

  async changePassword(values: { current_password: string; new_password: string }): Promise<void> {
    await apiClient.post('/auth/change-password', values);
  },

  async updateProfile(values: { name: string }): Promise<AuthUser> {
    const { data } = await apiClient.patch<ApiSuccessResponse<AuthUser>>('/auth/profile', values);
    return data.data;
  },
};
