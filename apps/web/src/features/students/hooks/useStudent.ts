import { useQuery } from '@tanstack/react-query';
import { studentsApi } from '../api/studentsApi';

export function useStudent(id: number) {
  return useQuery({
    queryKey: ['students', 'detail', id],
    queryFn: () => studentsApi.get(id),
  });
}
