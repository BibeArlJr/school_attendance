import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { attendanceApi, type AttendanceRecordListParams } from '../api/attendanceApi';

export function useAttendanceRecords(params: AttendanceRecordListParams) {
  return useQuery({
    queryKey: ['attendance', 'records', params],
    queryFn: () => attendanceApi.list(params),
    placeholderData: keepPreviousData,
  });
}
