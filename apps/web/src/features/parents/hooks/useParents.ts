import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { parentsApi, type ParentListParams } from '../api/parentsApi';

export function useParents(params: ParentListParams) {
  return useQuery({
    queryKey: ['parents', params],
    queryFn: () => parentsApi.list(params),
    placeholderData: keepPreviousData,
  });
}
