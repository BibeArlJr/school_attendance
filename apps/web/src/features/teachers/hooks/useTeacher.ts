import { useQuery } from '@tanstack/react-query';
import { teachersApi } from '../api/teachersApi';

export function useTeacher(uuid: string) {
  return useQuery({
    queryKey: ['teachers', 'detail', uuid],
    queryFn: () => teachersApi.get(uuid),
  });
}
