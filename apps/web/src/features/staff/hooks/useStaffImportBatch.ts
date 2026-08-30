import { useQuery } from '@tanstack/react-query';
import { staffImportApi } from '../api/staffImportApi';

export function useStaffImportBatch(batchId: number) {
  return useQuery({
    queryKey: ['staff', 'import', batchId],
    queryFn: () => staffImportApi.get(batchId),
    enabled: Number.isFinite(batchId),
  });
}
