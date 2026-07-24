import type { LoginFormValues } from '../schema';
import type { AuthUser, LoginResult } from '../types';
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
};
