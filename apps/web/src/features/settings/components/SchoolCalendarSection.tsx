import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useDeleteCalendarEntry } from '../hooks/useCalendarMutations';
import { useCalendarEntries } from '../hooks/useSettingsQueries';
import type { SchoolCalendarEntry } from '../types';
import { CalendarEntryFormDialog } from './CalendarEntryFormDialog';
import { DeleteConfirmDialog } from '@/shared/components/DeleteConfirmDialog';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { LoadingSkeleton } from '@/shared/components/feedback/LoadingSkeleton';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { LICENSE_EXPIRED_MESSAGE, useLicenseExpired } from '@/shared/hooks/useLicenseExpired';
import { formatBs } from '@/shared/lib/bikramSambat';
import { extractErrorMessage } from '@/shared/lib/errors';
import { formatTime12h } from '@/shared/lib/time';

const DAY_TYPE_LABEL: Record<string, string> = {
  working: 'Working (override)',
  holiday: 'Holiday',
  half_day: 'Half day',
  exam_day: 'Exam day',
};

const DAY_TYPE_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  working: 'outline',
  holiday: 'default',
  half_day: 'secondary',
  exam_day: 'secondary',
};

export function SchoolCalendarSection() {
  const licenseExpired = useLicenseExpired();
  const entriesQuery = useCalendarEntries();
  const deleteEntry = useDeleteCalendarEntry();

  const [formOpen, setFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<SchoolCalendarEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<SchoolCalendarEntry | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  function handleDeleteOpenChange(nextOpen: boolean) {
    setDeleteDialogOpen(nextOpen);
    if (!nextOpen) {
      deleteEntry.reset();
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>School Calendar</CardTitle>
        <Button
          size="sm"
          disabled={licenseExpired}
          title={licenseExpired ? LICENSE_EXPIRED_MESSAGE : undefined}
          onClick={() => {
            setEditingEntry(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" />
          Add Entry
        </Button>
      </CardHeader>
      <CardContent>
        {entriesQuery.isLoading ? (
          <LoadingSkeleton lines={4} />
        ) : entriesQuery.isError ? (
          <ErrorState onRetry={() => entriesQuery.refetch()} />
        ) : !entriesQuery.data || entriesQuery.data.length === 0 ? (
          <EmptyState title="No calendar entries yet" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Half day ends</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {entriesQuery.data.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    <div>{formatBs(entry.date.slice(0, 10))}</div>
                    <div className="text-xs text-muted-foreground">{entry.date.slice(0, 10)} AD</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={DAY_TYPE_VARIANT[entry.day_type]}>
                      {DAY_TYPE_LABEL[entry.day_type]}
                    </Badge>
                  </TableCell>
                  <TableCell>{entry.label ?? '—'}</TableCell>
                  <TableCell>
                    {entry.half_day_end_time ? formatTime12h(entry.half_day_end_time) : '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={licenseExpired}
                        title={licenseExpired ? LICENSE_EXPIRED_MESSAGE : undefined}
                        onClick={() => {
                          setEditingEntry(entry);
                          setFormOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        disabled={licenseExpired}
                        title={licenseExpired ? LICENSE_EXPIRED_MESSAGE : undefined}
                        onClick={() => {
                          setDeletingEntry(entry);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <CalendarEntryFormDialog open={formOpen} onOpenChange={setFormOpen} entry={editingEntry} />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={handleDeleteOpenChange}
        entityLabel="calendar entry"
        alternativeActionHint=""
        isPending={deleteEntry.isPending}
        errorMessage={deleteEntry.isError ? extractErrorMessage(deleteEntry.error) : null}
        onConfirm={() => {
          if (!deletingEntry) return;
          deleteEntry.mutate(deletingEntry.id, {
            onSuccess: () => setDeleteDialogOpen(false),
          });
        }}
      />
    </Card>
  );
}
