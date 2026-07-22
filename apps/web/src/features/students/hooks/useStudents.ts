import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { studentsApi, type StudentListParams } from '../api/studentsApi';

export function useStudents(params: StudentListParams) {
  return useQuery({
    queryKey: ['students', params],
    queryFn: () => studentsApi.list(params),
    placeholderData: keepPreviousData,
  });
}
