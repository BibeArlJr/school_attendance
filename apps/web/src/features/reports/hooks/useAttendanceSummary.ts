import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { reportsApi, type AttendanceSummaryParams } from '../api/reportsApi';

export function useAttendanceSummary(params: AttendanceSummaryParams) {
  return useQuery({
    queryKey: ['reports', 'attendance-summary', params],
    queryFn: () => reportsApi.attendanceSummary(params),
    placeholderData: keepPreviousData,
    // BsDateRangePicker (Prompt 29) reports an empty `to` mid-selection
    // (start picked, end not yet) — don't fire a request with a
    // half-complete range.
    enabled: Boolean(params.from && params.to),
  });
}
