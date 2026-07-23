import { useQuery } from '@tanstack/react-query';
import { importApi } from '../api/importApi';

export function useImportBatch(batchId: number) {
  return useQuery({
    queryKey: ['students', 'import', batchId],
    queryFn: () => importApi.get(batchId),
    enabled: Number.isFinite(batchId),
  });
}
