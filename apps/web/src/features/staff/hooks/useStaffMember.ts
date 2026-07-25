import { useQuery } from '@tanstack/react-query';
import { staffApi } from '../api/staffApi';

export function useStaffMember(uuid: string) {
  return useQuery({
    queryKey: ['staff', 'detail', uuid],
    queryFn: () => staffApi.get(uuid),
  });
}
