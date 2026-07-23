import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { GradeGroupCard } from '../components/GradeGroupCard';
import { ImportRowsTable } from '../components/ImportRowsTable';
import { ImportSummaryCards } from '../components/ImportSummaryCards';
import { useClasses } from '../hooks/useClasses';
import { useCommitImport } from '../hooks/useCommitImport';
import { useImportBatch } from '../hooks/useImportBatch';
import type { ImportRowDecision } from '../types/import';
import type { LocalDecisions } from '../types/importReview';
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

type FilterTab = 'all' | 'clean' | 'needs_review' | 'duplicates';

const FILTERS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'clean', label: 'Clean' },
  { key: 'needs_review', label: 'Needs Review' },
  { key: 'duplicates', label: 'Duplicates' },
];

export default function ImportReviewPage() {
  const { batchId } = useParams<{ batchId: string }>();
  const batchQuery = useImportBatch(Number(batchId));
  const classesQuery = useClasses();
  const commitImport = useCommitImport(Number(batchId));
  const canManage = useCan(['super_admin', 'admin']);

  const [decisions, setDecisions] = useState<LocalDecisions>({});
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const batch = batchQuery.data;

  function handleDecisionChange(rowId: number, patch: Partial<LocalDecisions[number]>) {
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
        if (row.flags.length === 0) {
          next[row.id] = { ...next[row.id], resolution: 'accept' };
        }
      }
      return next;
    });
  }

  // Only rows with an inferred grade and no decision yet — nothing to
  // group ungraded rows by confidently, so those always stay individual.
  // Recomputed off `decisions` too: once a group is bulk-applied its rows
  // are no longer 'pending', so the card for that grade disappears on
  // its own without extra bookkeeping.
  const gradeGroups = useMemo(() => {
    if (!batch) {
      return [];
    }
    const byGrade = new Map<number, typeof batch.rows>();
    for (const row of batch.rows) {
      const gradeLevel = row.proposed_data.inferred_grade_level;
      if (!row.flags.includes('unrecognized_class') || gradeLevel === null) {
        continue;
      }
      if ((decisions[row.id]?.resolution ?? 'pending') !== 'pending') {
        continue;
      }
      const existing = byGrade.get(gradeLevel) ?? [];
      existing.push(row);
      byGrade.set(gradeLevel, existing);
    }
    return Array.from(byGrade.entries())
      .map(([gradeLevel, rows]) => ({ gradeLevel, rows }))
      .sort((a, b) => a.gradeLevel - b.gradeLevel);
  }, [batch, decisions]);

  function handleApplyGroup(rowIds: number[], patch: { classId?: number; newClassName?: string }) {
    setDecisions((prev) => {
      const next = { ...prev };
      for (const rowId of rowIds) {
        next[rowId] = {
          ...next[rowId],
          resolution: 'accept',
          classId: patch.classId,
          newClassName: patch.newClassName,
        };
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
        return batch.rows.filter((row) => row.flags.length === 0);
      case 'needs_review':
        return batch.rows.filter((row) => row.flags.includes('unrecognized_class'));
      case 'duplicates':
        return batch.rows.filter((row) => row.flags.includes('possible_duplicate'));
      default:
        return batch.rows;
    }
  }, [batch, activeFilter]);

  const acceptCount = Object.values(decisions).filter((d) => d.resolution === 'accept').length;

  function buildPayload(): ImportRowDecision[] {
    return Object.entries(decisions)
      .filter(([, d]) => d.resolution === 'accept' || d.resolution === 'skip')
      .map(([rowId, d]) => ({
        id: Number(rowId),
        resolution: d.resolution as 'accept' | 'skip',
        class_id: d.classId,
        new_class_name: d.newClassName,
        first_name: d.firstName,
        last_name: d.lastName,
      }));
  }

  function handleConfirmCommit() {
    commitImport.mutate(buildPayload(), {
      onSuccess: () => setConfirmOpen(false),
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

  if (commitImport.isSuccess) {
    const results = commitImport.data;
    return (
      <PageContainer title="Import Committed">
        <Card className="mx-auto max-w-lg">
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>
              <span className="font-semibold text-emerald-600">{results.created}</span> student
              {results.created === 1 ? '' : 's'} created,{' '}
              <span className="font-semibold text-muted-foreground">{results.skipped}</span> skipped.
            </p>
            {results.errors.length > 0 && (
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
              <Link to={ROUTES.STUDENTS}>Back to Students</Link>
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  const total = batch.rows.length;
  const clean = batch.rows.filter((row) => row.flags.length === 0).length;
  const needsReview = batch.rows.filter((row) => row.flags.includes('unrecognized_class')).length;
  const duplicates = batch.rows.filter((row) => row.flags.includes('possible_duplicate')).length;

  return (
    <PageContainer title="Review Import" description={batch.file_name}>
      <div className="space-y-4">
        <ImportSummaryCards total={total} clean={clean} needsReview={needsReview} duplicates={duplicates} />

        {batch.skipped_sheets.length > 0 && (
          <div className="rounded-md border border-amber-400 bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            {batch.skipped_sheets.map((sheet) => (
              <p key={sheet.sheet_name}>
                &ldquo;{sheet.sheet_name}&rdquo; skipped: {sheet.reason}
              </p>
            ))}
          </div>
        )}

        {gradeGroups.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Resolve by grade — {gradeGroups.reduce((sum, group) => sum + group.rows.length, 0)} rows across{' '}
              {gradeGroups.length} grade{gradeGroups.length === 1 ? '' : 's'} can be resolved at once
            </h3>
            {gradeGroups.map((group) => (
              <GradeGroupCard
                key={group.gradeLevel}
                gradeLevel={group.gradeLevel}
                rows={group.rows}
                classes={classesQuery.data ?? []}
                onApply={handleApplyGroup}
              />
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

        <ImportRowsTable
          rows={filteredRows}
          classes={classesQuery.data ?? []}
          decisions={decisions}
          onDecisionChange={handleDecisionChange}
        />

        <div className="flex items-center justify-end gap-3 border-t pt-4">
          <span className="text-sm text-muted-foreground">
            {acceptCount} row{acceptCount === 1 ? '' : 's'} will be created
          </span>
          <Button onClick={() => setConfirmOpen(true)} disabled={acceptCount === 0}>
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
            This creates {acceptCount} new student{acceptCount === 1 ? '' : 's'} (with guardians and ID cards),
            exactly as if added one at a time. Rows not marked "accept" are skipped and can be re-imported later.
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
