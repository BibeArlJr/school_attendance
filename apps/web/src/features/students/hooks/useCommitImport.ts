import { useMutation, useQueryClient } from '@tanstack/react-query';
import { importApi } from '../api/importApi';
import type { ImportRowDecision } from '../types/import';

export function useCommitImport(batchId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (rows: ImportRowDecision[]) => importApi.commit(batchId, rows),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['students', 'import', batchId] });
      void queryClient.invalidateQueries({ queryKey: ['students'] });
      void queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });
}
