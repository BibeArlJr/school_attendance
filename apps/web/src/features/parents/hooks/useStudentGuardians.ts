import { useQuery } from '@tanstack/react-query';
import { studentGuardiansApi } from '../api/parentsApi';

export function useStudentGuardians(studentUuid: string) {
  return useQuery({
    queryKey: ['students', studentUuid, 'guardians'],
    queryFn: () => studentGuardiansApi.list(studentUuid),
  });
}
