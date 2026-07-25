import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { attendanceApi } from '../api/attendanceApi';

export function useStudentCalendar(studentUuid: string, from: string, to: string) {
  return useQuery({
    queryKey: ['attendance', 'student-calendar', studentUuid, from, to],
    queryFn: () => attendanceApi.studentCalendar(studentUuid, from, to),
    placeholderData: keepPreviousData,
  });
}
