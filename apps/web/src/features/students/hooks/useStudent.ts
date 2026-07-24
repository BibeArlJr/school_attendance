import { useQuery } from '@tanstack/react-query';
import { studentsApi } from '../api/studentsApi';

export function useStudent(uuid: string) {
  return useQuery({
    queryKey: ['students', 'detail', uuid],
    queryFn: () => studentsApi.get(uuid),
  });
}
