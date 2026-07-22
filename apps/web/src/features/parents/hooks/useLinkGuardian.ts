import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { studentGuardiansApi } from '../api/parentsApi';
import type { AddGuardianFormValues } from '../schema';

interface LinkGuardianInput extends AddGuardianFormValues {
  parent_id?: number;
  phone?: string;
}

export function useLinkGuardian(studentId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: LinkGuardianInput) => studentGuardiansApi.link(studentId, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['students', studentId, 'guardians'] });
      void queryClient.invalidateQueries({ queryKey: ['parents'] });
      toast.success('Guardian linked successfully.');
    },
  });
}
