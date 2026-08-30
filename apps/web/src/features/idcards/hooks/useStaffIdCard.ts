import { useQuery } from '@tanstack/react-query';
import { idCardsApi } from '../api/idCardsApi';

export function useStaffIdCard(staffUuid: string) {
  return useQuery({
    queryKey: ['staff', staffUuid, 'id-card'],
    queryFn: () => idCardsApi.getForStaff(staffUuid),
    retry: false,
  });
}
