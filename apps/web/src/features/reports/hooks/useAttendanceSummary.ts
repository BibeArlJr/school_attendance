import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { reportsApi, type AttendanceSummaryParams } from '../api/reportsApi';

export function useAttendanceSummary(params: AttendanceSummaryParams) {
  return useQuery({
    queryKey: ['reports', 'attendance-summary', params],
    queryFn: () => reportsApi.attendanceSummary(params),
    placeholderData: keepPreviousData,
  });
}
