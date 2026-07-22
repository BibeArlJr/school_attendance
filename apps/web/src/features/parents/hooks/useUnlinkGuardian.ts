import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { studentGuardiansApi } from '../api/parentsApi';

export function useUnlinkGuardian(studentId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (parentId: number) => studentGuardiansApi.unlink(studentId, parentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['students', studentId, 'guardians'] });
      void queryClient.invalidateQueries({ queryKey: ['parents'] });
      toast.success('Guardian unlinked successfully.');
    },
  });
}
