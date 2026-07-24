import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { attendanceApi } from '../api/attendanceApi';

export function useStudentCalendar(studentUuid: string, year: number, month: number) {
  return useQuery({
    queryKey: ['attendance', 'student-calendar', studentUuid, year, month],
    queryFn: () => attendanceApi.studentCalendar(studentUuid, year, month),
    placeholderData: keepPreviousData,
  });
}
