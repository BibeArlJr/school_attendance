import { useQuery } from '@tanstack/react-query';
import { usersApi } from '../api/usersApi';

export function useUserMember(uuid: string) {
  return useQuery({
    queryKey: ['users', 'detail', uuid],
    queryFn: () => usersApi.get(uuid),
  });
}
