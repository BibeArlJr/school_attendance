import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { staffApi } from '../api/staffApi';
import type { StaffFormValues } from '../schema';

export function useUpdateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: StaffFormValues }) => staffApi.update(id, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Staff member updated successfully.');
    },
  });
}
