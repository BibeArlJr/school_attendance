import { useQuery } from '@tanstack/react-query';
import { classesApi } from '../api/studentsApi';

export function useClasses() {
  return useQuery({
    queryKey: ['classes'],
    queryFn: classesApi.list,
  });
}
