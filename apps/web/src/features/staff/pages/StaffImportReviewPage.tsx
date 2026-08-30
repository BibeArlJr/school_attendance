import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ImportSummaryCards } from '../components/ImportSummaryCards';
import { StaffImportRowsTable } from '../components/StaffImportRowsTable';
import { useCommitStaffImport } from '../hooks/useCommitStaffImport';
import { useStaffImportBatch } from '../hooks/useStaffImportBatch';
import type { StaffImportRowDecision } from '../types/import';
import { effectiveStaffResolution, type LocalStaffDecisions } from '../types/importReview';
import { ROUTES } from '@/app/router/routes';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { ForbiddenState } from '@/shared/components/feedback/ForbiddenState';
import { LoadingSkeleton } from '@/shared/components/feedback/LoadingSkeleton';
import { PageContainer } from '@/shared/components/layout/PageContainer';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { useCan } from '@/shared/hooks/useCan';
import { LICENSE_EXPIRED_MESSAGE, useLicenseExpired } from '@/shared/hooks/useLicenseExpired';
import { extractErrorMessage } from '@/shared/lib/errors';

type FilterTab = 'all' | 'clean' | 'needs_review';

const FILTERS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'clean', label: 'Clean' },
  { key: 'needs_review', label: 'Needs Review' },
];

// Simpler sibling of students/pages/ImportReviewPage — no grade-group
// resolution step at all (staff has no class concept), so this is just
// filter tabs + a rows table + commit, no bulk-grouping UI.
export default function StaffImportReviewPage() {
  const { batchId } = useParams<{ batchId: string }>();
  const batchQuery = useStaffImportBatch(Number(batchId));
  const commitImport = useCommitStaffImport(Number(batchId));
  const canManage = useCan(['super_admin', 'admin']);
  const licenseExpired = useLicenseExpired(canManage);

  const [decisions, setDecisions] = useState<LocalStaffDecisions>({});
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const batch = batchQuery.data;

  function handleDecisionChange(rowId: number, patch: Partial<LocalStaffDecisions[number]>) {
    setDecisions((prev) => ({
      ...prev,
      [rowId]: {
        resolution: 'pending',
        ...prev[rowId],
        ...patch,
      },
    }));
  }

  function handleAcceptAllClean() {
    if (!batch) {
      return;
    }
    setDecisions((prev) => {
      const next = { ...prev };
      for (const row of batch.rows) {
        if (!row.flags.includes('possible_duplicate')) {
          next[row.id] = { ...next[row.id], resolution: 'accept' };
        }
      }
      return next;
    });
  }

  const filteredRows = useMemo(() => {
    if (!batch) {
      return [];
    }
    switch (activeFilter) {
      case 'clean':
        return batch.rows.filter((row) => !row.flags.includes('possible_duplicate'));
      case 'needs_review':
        return batch.rows.filter((row) => row.flags.includes('possible_duplicate'));
      default:
        return batch.rows;
    }
  }, [batch, activeFilter]);

  const acceptCount = batch
    ? batch.rows.filter(
        (row) => effectiveStaffResolution(row.flags, decisions[row.id]?.resolution) === 'accept',
      ).length
    : 0;

  function buildPayload(): StaffImportRowDecision[] {
    if (!batch) {
      return [];
    }
    return batch.rows
      .map((row) => {
        const decision = decisions[row.id];
        const resolution = effectiveStaffResolution(row.flags, decision?.resolution);
        return { row, decision, resolution };
      })
      .filter(({ resolution }) => resolution === 'accept' || resolution === 'skip')
      .map(({ row, decision, resolution }) => ({
        id: row.id,
        resolution: resolution as 'accept' | 'skip',
        name: decision?.name,
      }));
  }

  function handleConfirmCommit() {
    if (commitImport.isPending) {
      return;
    }

    commitImport.mutate(buildPayload(), {
      onSuccess: () => setConfirmOpen(false),
      onError: (error) => toast.error(extractErrorMessage(error)),
    });
  }

  if (!canManage) {
    return (
      <PageContainer title="Review Import">
        <ForbiddenState />
      </PageContainer>
    );
  }

  if (batchQuery.isLoading) {
    return (
      <PageContainer title="Review Import">
        <LoadingSkeleton lines={6} />
      </PageContainer>
    );
  }

  if (!batch) {
    return (
      <PageContainer title="Review Import">
        <EmptyState title="Import batch not found" />
      </PageContainer>
    );
  }

  // Same dual-source terminal-state check as the student review page —
  // batch.status is the real, persisted source of truth (see that
  // page's comment for the full reasoning).
  if (commitImport.isSuccess || batch.status === 'committed') {
    const results = commitImport.data;
    return (
      <PageContainer title="Import Committed">
        <Card className="mx-auto max-w-lg">
          <CardHeader>
            <CardTitle>{results ? 'Results' : 'Already committed'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {results ? (
              <p>
                <span className="font-semibold text-emerald-600">{results.created}</span> staff member
                {results.created === 1 ? '' : 's'} created out of {batch.rows.length} row
                {batch.rows.length === 1 ? '' : 's'} in the file,{' '}
                <span className="font-semibold text-muted-foreground">{results.skipped}</span> skipped
                (marked skip, or left unresolved while flagged for review).
              </p>
            ) : (
              <p>
                This import (<span className="font-medium">{batch.imported_count}</span> of{' '}
                {batch.total_rows} rows) was already committed and cannot be committed again.
              </p>
            )}
            {results && results.errors.length > 0 && (
              <div className="space-y-1 rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm">
                <p className="font-medium text-destructive">{results.errors.length} row(s) failed:</p>
                <ul className="list-inside list-disc text-destructive">
                  {results.errors.map((error) => (
                    <li key={error.row_id}>
                      {error.sheet_name} #{error.row_number}: {error.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Button asChild>
              <Link to={ROUTES.STAFF}>Back to Staff</Link>
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  const total = batch.rows.length;
  const needsReview = batch.rows.filter((row) => row.flags.includes('possible_duplicate')).length;
  const clean = total - needsReview;

  return (
    <PageContainer title="Review Import" description={batch.file_name}>
      <div className="space-y-4">
        <ImportSummaryCards total={total} clean={clean} needsReview={needsReview} />

        {batch.skipped_sheets.length > 0 && (
          <div className="rounded-md border border-amber-400 bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            {batch.skipped_sheets.map((sheet) => (
              <p key={sheet.sheet_name}>
                &ldquo;{sheet.sheet_name}&rdquo; skipped: {sheet.reason}
              </p>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-1">
            {FILTERS.map((filter) => (
              <Button
                key={filter.key}
                size="sm"
                variant={activeFilter === filter.key ? 'default' : 'outline'}
                onClick={() => setActiveFilter(filter.key)}
              >
                {filter.label}
              </Button>
            ))}
          </div>
          <Button size="sm" variant="outline" onClick={handleAcceptAllClean}>
            Accept all clean rows
          </Button>
        </div>

        <StaffImportRowsTable rows={filteredRows} decisions={decisions} onDecisionChange={handleDecisionChange} />

        <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 border-t bg-background/95 py-3 backdrop-blur">
          <span className="text-sm text-muted-foreground">
            {acceptCount} row{acceptCount === 1 ? '' : 's'} will be created
          </span>
          <Button
            onClick={() => setConfirmOpen(true)}
            disabled={acceptCount === 0 || licenseExpired || commitImport.isPending}
            title={licenseExpired ? LICENSE_EXPIRED_MESSAGE : undefined}
          >
            Commit import
          </Button>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Commit import?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This creates {acceptCount} new staff member{acceptCount === 1 ? '' : 's'} (with ID cards),
            exactly as if added one at a time. Rows not marked "accept" are skipped and can be
            re-imported later.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmCommit} disabled={commitImport.isPending}>
              {commitImport.isPending ? 'Committing…' : 'Commit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
