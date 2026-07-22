import { useQuery } from '@tanstack/react-query';
import { studentGuardiansApi } from '../api/parentsApi';

export function useStudentGuardians(studentId: number) {
  return useQuery({
    queryKey: ['students', studentId, 'guardians'],
    queryFn: () => studentGuardiansApi.list(studentId),
  });
}
