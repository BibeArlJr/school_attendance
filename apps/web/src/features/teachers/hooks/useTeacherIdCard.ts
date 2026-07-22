import { useQuery } from '@tanstack/react-query';
import { teacherIdCardApi } from '../api/teacherIdCardApi';

export function useTeacherIdCard(teacherId: number) {
  return useQuery({
    queryKey: ['teachers', teacherId, 'id-card'],
    queryFn: () => teacherIdCardApi.get(teacherId),
    retry: false,
  });
}
