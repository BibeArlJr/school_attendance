import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { teacherIdCardApi } from '../api/teacherIdCardApi';

export function useReissueTeacherIdCard(teacherUuid: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => teacherIdCardApi.reissue(teacherUuid),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['teachers', teacherUuid, 'id-card'] });
      toast.success('ID card reissued successfully.');
    },
  });
}
