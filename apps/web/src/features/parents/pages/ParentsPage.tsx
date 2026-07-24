import { Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { parentsApi } from '../api/parentsApi';
import { buildParentColumns } from '../components/parentColumns';
import { ParentFormDialog } from '../components/ParentFormDialog';
import { useDeleteParent } from '../hooks/useDeleteParent';
import { useParents } from '../hooks/useParents';
import type { ParentGuardian } from '../types';
import { DataTable } from '@/shared/components/data-table/DataTable';
import { DeleteConfirmDialog } from '@/shared/components/DeleteConfirmDialog';
import { PageContainer } from '@/shared/components/layout/PageContainer';
import { Button } from '@/shared/components/ui/button';
import { useBulkDelete } from '@/shared/hooks/useBulkDelete';
import { extractErrorMessage } from '@/shared/lib/errors';

const PER_PAGE = 10;

export default function ParentsPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const [editingParent, setEditingParent] = useState<ParentGuardian | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deletingParent, setDeletingParent] = useState<ParentGuardian | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const deleteParent = useDeleteParent();
  const { bulkDelete } = useBulkDelete<ParentGuardian>({
    queryKey: ['parents'],
    deleteFn: parentsApi.delete,
    getLabel: (parent) => parent.name,
  });

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(id);
  }, [search]);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPageIndex(0);
  }

  const parentsQuery = useParents({
    page: pageIndex + 1,
    per_page: PER_PAGE,
    search: debouncedSearch || undefined,
  });

  const columns = useMemo(
    () =>
      buildParentColumns({
        onEdit: (parent) => {
          setEditingParent(parent);
          setFormOpen(true);
        },
        onDeleteRequest: (parent) => {
          setDeletingParent(parent);
          setDeleteDialogOpen(true);
        },
      }),
    [],
  );

  function handleDeleteOpenChange(nextOpen: boolean) {
    setDeleteDialogOpen(nextOpen);
    if (!nextOpen) {
      deleteParent.reset();
    }
  }

  return (
    <PageContainer title="Parents" description="Manage parent/guardian contacts and student links.">
      <DataTable
        columns={columns}
        data={parentsQuery.data?.data ?? []}
        isLoading={parentsQuery.isLoading}
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search by name or phone"
        pageIndex={pageIndex}
        pageCount={parentsQuery.data?.last_page ?? 1}
        onPageChange={setPageIndex}
        totalCount={parentsQuery.data?.total}
        emptyTitle="No parents found"
        selection={{
          onDeleteSelected: (rows) => bulkDelete(rows, (parent) => parent.id),
          entityLabelPlural: 'parents',
          fetchAllMatching: async () => {
            const total = parentsQuery.data?.total ?? 0;
            if (total === 0) {
              return [];
            }
            const result = await parentsApi.list({
              per_page: total,
              search: debouncedSearch || undefined,
            });
            return result.data;
          },
        }}
        actions={
          <Button
            onClick={() => {
              setEditingParent(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" />
            Add Parent
          </Button>
        }
      />

      <ParentFormDialog open={formOpen} onOpenChange={setFormOpen} parent={editingParent} />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={handleDeleteOpenChange}
        entityLabel="parent"
        alternativeActionHint="If this parent still has students linked, unlink them first from the student's guardian section — delete is only for records added by mistake."
        isPending={deleteParent.isPending}
        errorMessage={deleteParent.isError ? extractErrorMessage(deleteParent.error) : null}
        onConfirm={() => {
          if (!deletingParent) return;
          deleteParent.mutate(deletingParent.id, {
            onSuccess: () => setDeleteDialogOpen(false),
          });
        }}
      />
    </PageContainer>
  );
}
