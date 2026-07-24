import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { reportsApi, type EnrollmentSummaryParams } from '../api/reportsApi';

export function useEnrollmentSummary(params: EnrollmentSummaryParams) {
  return useQuery({
    queryKey: ['reports', 'enrollment-summary', params],
    queryFn: () => reportsApi.enrollmentSummary(params),
    placeholderData: keepPreviousData,
  });
}
