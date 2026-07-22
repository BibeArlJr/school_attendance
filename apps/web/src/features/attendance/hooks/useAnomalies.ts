import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { attendanceApi } from '../api/attendanceApi';

export function useAnomalies(page: number) {
  return useQuery({
    queryKey: ['attendance', 'anomalies', page],
    queryFn: () => attendanceApi.anomalies({ page }),
    placeholderData: keepPreviousData,
  });
}
