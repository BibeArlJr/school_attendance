import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { teacherIdCardApi } from '../api/teacherIdCardApi';

export function useReissueTeacherIdCard(teacherId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => teacherIdCardApi.reissue(teacherId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['teachers', teacherId, 'id-card'] });
      toast.success('ID card reissued successfully.');
    },
  });
}
