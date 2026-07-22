import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { idCardsApi } from '../api/idCardsApi';

export function useReissueIdCard(studentId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => idCardsApi.reissue(studentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['students', studentId, 'id-card'] });
      void queryClient.invalidateQueries({ queryKey: ['id-cards'] });
      toast.success('ID card reissued successfully.');
    },
  });
}
