import { useEffect, useMemo, useState } from 'react';
import { CreditsCard } from '../components/CreditsCard';
import { SmsLogDetailDialog } from '../components/SmsLogDetailDialog';
import { buildSmsLogColumns } from '../components/smsLogColumns';
import { useSmsLogs } from '../hooks/useSmsLogs';
import type { SmsLog } from '../types';
import { DataTable } from '@/shared/components/data-table/DataTable';
import { PageContainer } from '@/shared/components/layout/PageContainer';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';

const PER_PAGE = 15;

export default function SmsLogPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedLog, setSelectedLog] = useState<SmsLog | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(id);
  }, [search]);

  const logsQuery = useSmsLogs({
    page: pageIndex + 1,
    per_page: PER_PAGE,
    search: debouncedSearch || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });

  const columns = useMemo(() => buildSmsLogColumns(), []);

  return (
    <PageContainer title="SMS Log" description="Every SMS attempt sent to parents, real or mock.">
      <div className="mb-4">
        <CreditsCard />
      </div>

      <DataTable
        columns={columns}
        data={logsQuery.data?.data ?? []}
        isLoading={logsQuery.isLoading}
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPageIndex(0);
        }}
        searchPlaceholder="Search by recipient phone"
        pageIndex={pageIndex}
        pageCount={logsQuery.data?.last_page ?? 1}
        onPageChange={setPageIndex}
        totalCount={logsQuery.data?.total}
        emptyTitle="No SMS activity yet"
        onRowClick={setSelectedLog}
        filters={
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setPageIndex(0);
            }}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <SmsLogDetailDialog log={selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)} />
    </PageContainer>
  );
}
