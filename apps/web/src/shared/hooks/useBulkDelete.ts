import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useState } from 'react';
import { extractErrorMessage } from '../lib/errors';

export interface BulkDeleteResult {
  deletedCount: number;
  blocked: { label: string; reason: string }[];
}

interface UseBulkDeleteOptions<T> {
  queryKey: QueryKey;
  deleteFn: (id: number) => Promise<void>;
  getLabel: (row: T) => string;
}

/**
 * Sequential, per-row delete against an entity's existing single-delete
 * endpoint (Phase 11) — no separate bulk-delete endpoint, so every row
 * gets exactly the same safety checks a one-at-a-time delete would.
 * Calls the API function directly rather than routing through the
 * entity's useDeleteX mutation hook, so a batch of N deletes doesn't
 * also fire N "X deleted." toasts — the caller shows one summary
 * instead. Sequential (not Promise.all) so results attribute cleanly to
 * each row and one failure can never affect another row's outcome.
 */
export function useBulkDelete<T>({ queryKey, deleteFn, getLabel }: UseBulkDeleteOptions<T>) {
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);

  async function bulkDelete(rows: T[], getId: (row: T) => number): Promise<BulkDeleteResult> {
    setIsPending(true);
    let deletedCount = 0;
    const blocked: BulkDeleteResult['blocked'] = [];

    for (const row of rows) {
      try {
        await deleteFn(getId(row));
        deletedCount++;
      } catch (error) {
        blocked.push({ label: getLabel(row), reason: extractErrorMessage(error) });
      }
    }

    await queryClient.invalidateQueries({ queryKey });
    setIsPending(false);

    return { deletedCount, blocked };
  }

  return { bulkDelete, isPending };
}
