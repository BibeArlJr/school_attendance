import { useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceApi } from '../api/attendanceApi';

export function useScan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (barcodeValue: string) => attendanceApi.scan(barcodeValue),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}
