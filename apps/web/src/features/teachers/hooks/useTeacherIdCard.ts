import { useQuery } from '@tanstack/react-query';
import { teacherIdCardApi } from '../api/teacherIdCardApi';

export function useTeacherIdCard(teacherUuid: string) {
  return useQuery({
    queryKey: ['teachers', teacherUuid, 'id-card'],
    queryFn: () => teacherIdCardApi.get(teacherUuid),
    retry: false,
  });
}
