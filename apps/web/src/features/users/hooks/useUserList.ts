import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { usersApi, type UserAccountListParams } from '../api/usersApi';

export function useUserList(params: UserAccountListParams) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => usersApi.list(params),
    placeholderData: keepPreviousData,
  });
}
