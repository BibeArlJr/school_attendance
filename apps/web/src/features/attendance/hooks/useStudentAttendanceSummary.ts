import { useQuery } from '@tanstack/react-query';
import { attendanceApi } from '../api/attendanceApi';

export function useStudentAttendanceSummary(studentUuid: string) {
  return useQuery({
    queryKey: ['attendance', 'student-summary', studentUuid],
    queryFn: () => attendanceApi.studentSummary(studentUuid),
  });
}
