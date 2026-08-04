import { Download, Printer } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { idCardsApi } from '../api/idCardsApi';
import { buildIdCardColumns } from '../components/idCardColumns';
import { useIdCards } from '../hooks/useIdCards';
import { exportIdCardsCsv } from '../lib/exportIdCardsCsv';
import type { IdCard } from '../types';
import { ROUTES } from '@/app/router/routes';
import { DataTable } from '@/shared/components/data-table/DataTable';
import { PageContainer } from '@/shared/components/layout/PageContainer';
import { Button } from '@/shared/components/ui/button';

const PER_PAGE = 10;

export default function BarcodePage() {
  const navigate = useNavigate();
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
    <PageContainer title="QR Code / ID Cards" description="Every student's ID card and QR code value.">
      <DataTable
        columns={columns}
        data={cardsQuery.data?.data ?? []}
        isLoading={cardsQuery.isLoading}
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search by name or QR code"
        pageIndex={pageIndex}
        pageCount={cardsQuery.data?.last_page ?? 1}
        onPageChange={setPageIndex}
        totalCount={cardsQuery.data?.total}
        emptyTitle="No ID cards found"
        selection={{
          // Read-only bulk actions only — no delete on this page, and no
          // extra RBAC gate here beyond the page's own (export/print are
          // available to every role that can already see this page,
          // teacher included, matching Phase 6's existing access).
          entityLabelPlural: 'ID cards',
          fetchAllMatching: async () => {
            const total = cardsQuery.data?.total ?? 0;
            if (total === 0) {
              return [];
            }
            const result = await idCardsApi.list({
              per_page: total,
              search: debouncedSearch || undefined,
            });
            return result.data;
          },
          renderActions: (rows: IdCard[]) => (
            <>
              <Button size="sm" variant="outline" onClick={() => exportIdCardsCsv(rows)}>
                <Download className="size-4" />
                Export CSV
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(ROUTES.BARCODE_PRINT, { state: { cards: rows } })}
              >
                <Printer className="size-4" />
                Print Selected
              </Button>
            </>
          ),
        }}
      />
    </PageContainer>
  );
}
