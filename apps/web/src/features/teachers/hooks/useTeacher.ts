import { useQuery } from '@tanstack/react-query';
import { teachersApi } from '../api/teachersApi';

export function useTeacher(id: number) {
  return useQuery({
    queryKey: ['teachers', 'detail', id],
    queryFn: () => teachersApi.get(id),
  });
}
