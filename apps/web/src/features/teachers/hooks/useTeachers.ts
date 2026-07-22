import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { teachersApi, type TeacherListParams } from '../api/teachersApi';

export function useTeachers(params: TeacherListParams) {
  return useQuery({
    queryKey: ['teachers', params],
    queryFn: () => teachersApi.list(params),
    placeholderData: keepPreviousData,
  });
}
