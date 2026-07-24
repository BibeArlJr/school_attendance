import { useQuery } from '@tanstack/react-query';
import { idCardsApi } from '../api/idCardsApi';

export function useStudentIdCard(studentUuid: string) {
  return useQuery({
    queryKey: ['students', studentUuid, 'id-card'],
    queryFn: () => idCardsApi.getForStudent(studentUuid),
    retry: false,
  });
}
