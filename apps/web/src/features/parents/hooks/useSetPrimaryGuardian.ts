import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { studentGuardiansApi } from '../api/parentsApi';

export function useSetPrimaryGuardian(studentUuid: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (parentUuid: string) => studentGuardiansApi.setPrimary(studentUuid, parentUuid),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['students', studentUuid, 'guardians'] });
      toast.success('Primary contact updated.');
    },
  });
}
