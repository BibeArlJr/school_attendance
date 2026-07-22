import { useQuery } from '@tanstack/react-query';
import { parentsApi } from '../api/parentsApi';

export function useParent(id: number) {
  return useQuery({
    queryKey: ['parents', 'detail', id],
    queryFn: () => parentsApi.get(id),
  });
}
