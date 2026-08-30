import { useMutation, useQueryClient } from '@tanstack/react-query';
import { staffImportApi } from '../api/staffImportApi';
import type { StaffImportRowDecision } from '../types/import';

export function useCommitStaffImport(batchId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (rows: StaffImportRowDecision[]) => staffImportApi.commit(batchId, rows),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['staff', 'import', batchId] });
      void queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });
}
