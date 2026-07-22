import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { idCardsApi, type IdCardListParams } from '../api/idCardsApi';

export function useIdCards(params: IdCardListParams) {
  return useQuery({
    queryKey: ['id-cards', params],
    queryFn: () => idCardsApi.list(params),
    placeholderData: keepPreviousData,
  });
}
