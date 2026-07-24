import { useQuery } from '@tanstack/react-query';
import { parentsApi } from '../api/parentsApi';

export function useParent(uuid: string) {
  return useQuery({
    queryKey: ['parents', 'detail', uuid],
    queryFn: () => parentsApi.get(uuid),
  });
}
