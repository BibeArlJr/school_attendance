import { Download, Printer } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { idCardsApi } from '../api/idCardsApi';
import { buildIdCardColumns } from '../components/idCardColumns';
import { useIdCards } from '../hooks/useIdCards';
import { exportIdCardsCsv } from '../lib/exportIdCardsCsv';
import type { IdCard, IdCardOwnerType } from '../types';
import { ROUTES } from '@/app/router/routes';
import { DataTable } from '@/shared/components/data-table/DataTable';
import { PageContainer } from '@/shared/components/layout/PageContainer';
import { Button } from '@/shared/components/ui/button';

const PER_PAGE = 10;

export default function BarcodePage() {
  const navigate = useNavigate();
  // Students/Staff tab (restored, Rebuild Staff Module Part D.6) — same
  // pattern as AttendancePage's tab: switching resets the page.
  const [ownerType, setOwnerType] = useState<IdCardOwnerType>('student');
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
    owner_type: ownerType,
    page: pageIndex + 1,
    per_page: PER_PAGE,
    search: debouncedSearch || undefined,
  });

  const columns = useMemo(() => buildIdCardColumns(ownerType), [ownerType]);

  return (
    <PageContainer
      title="QR Code / ID Cards"
      description="Every student and staff member's ID card and QR code value."
    >
      <div className="mb-4 flex gap-1.5">
        <Button
          variant={ownerType === 'student' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setOwnerType('student');
            setPageIndex(0);
          }}
        >
          Students
        </Button>
        <Button
          variant={ownerType === 'staff' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setOwnerType('staff');
            setPageIndex(0);
          }}
        >
          Staff
        </Button>
      </div>
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
              owner_type: ownerType,
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
