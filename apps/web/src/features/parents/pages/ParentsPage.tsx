import { Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { buildParentColumns } from '../components/parentColumns';
import { ParentFormDialog } from '../components/ParentFormDialog';
import { useParents } from '../hooks/useParents';
import type { ParentGuardian } from '../types';
import { DataTable } from '@/shared/components/data-table/DataTable';
import { PageContainer } from '@/shared/components/layout/PageContainer';
import { Button } from '@/shared/components/ui/button';

const PER_PAGE = 10;

export default function ParentsPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const [editingParent, setEditingParent] = useState<ParentGuardian | null>(null);
  const [formOpen, setFormOpen] = useState(false);

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
      }),
    [],
  );

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
    </PageContainer>
  );
}
