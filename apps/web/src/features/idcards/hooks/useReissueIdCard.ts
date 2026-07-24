import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { idCardsApi } from '../api/idCardsApi';

export function useReissueIdCard(studentUuid: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => idCardsApi.reissue(studentUuid),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['students', studentUuid, 'id-card'] });
      void queryClient.invalidateQueries({ queryKey: ['id-cards'] });
      toast.success('ID card reissued successfully.');
    },
  });
}
