import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { studentGuardiansApi } from '../api/parentsApi';

export function useUnlinkGuardian(studentUuid: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (parentUuid: string) => studentGuardiansApi.unlink(studentUuid, parentUuid),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['students', studentUuid, 'guardians'] });
      void queryClient.invalidateQueries({ queryKey: ['parents'] });
      toast.success('Guardian unlinked successfully.');
    },
  });
}
