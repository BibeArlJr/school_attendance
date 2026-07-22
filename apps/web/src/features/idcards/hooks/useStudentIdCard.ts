import { useQuery } from '@tanstack/react-query';
import { idCardsApi } from '../api/idCardsApi';

export function useStudentIdCard(studentId: number) {
  return useQuery({
    queryKey: ['students', studentId, 'id-card'],
    queryFn: () => idCardsApi.getForStudent(studentId),
    retry: false,
  });
}
