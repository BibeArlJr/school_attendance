import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { staffApi, type StaffListParams } from '../api/staffApi';

export function useStaffList(params: StaffListParams) {
  return useQuery({
    queryKey: ['staff', params],
    queryFn: () => staffApi.list(params),
    placeholderData: keepPreviousData,
  });
}
