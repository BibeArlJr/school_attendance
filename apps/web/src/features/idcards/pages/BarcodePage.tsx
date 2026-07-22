import { useEffect, useMemo, useState } from 'react';
import { buildIdCardColumns } from '../components/idCardColumns';
import { useIdCards } from '../hooks/useIdCards';
import { DataTable } from '@/shared/components/data-table/DataTable';
import { PageContainer } from '@/shared/components/layout/PageContainer';

const PER_PAGE = 10;

export default function BarcodePage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(id);
  }, [search]);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPageIndex(0);
  }

  const cardsQuery = useIdCards({
    page: pageIndex + 1,
    per_page: PER_PAGE,
    search: debouncedSearch || undefined,
  });

  const columns = useMemo(() => buildIdCardColumns(), []);

  return (
    <PageContainer title="Barcode / ID Cards" description="Every student's ID card and barcode value.">
      <DataTable
        columns={columns}
        data={cardsQuery.data?.data ?? []}
        isLoading={cardsQuery.isLoading}
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search by name, admission no., or barcode"
        pageIndex={pageIndex}
        pageCount={cardsQuery.data?.last_page ?? 1}
        onPageChange={setPageIndex}
        totalCount={cardsQuery.data?.total}
        emptyTitle="No ID cards found"
      />
    </PageContainer>
  );
}
