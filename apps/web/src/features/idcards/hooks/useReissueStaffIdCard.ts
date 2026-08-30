import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { idCardsApi } from '../api/idCardsApi';

export function useReissueStaffIdCard(staffUuid: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => idCardsApi.reissueForStaff(staffUuid),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['staff', staffUuid, 'id-card'] });
      void queryClient.invalidateQueries({ queryKey: ['id-cards'] });
      toast.success('ID card reissued successfully.');
    },
  });
}
