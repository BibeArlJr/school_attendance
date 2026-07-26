import { useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { AuditLogDetailDialog } from '../components/AuditLogDetailDialog';
import { buildAuditLogColumns } from '../components/auditLogColumns';
import { useAuditLogActions, useAuditLogActors, useAuditLogs } from '../hooks/useAuditLogs';
import { useSchools } from '../hooks/useSchools';
import type { AuditLogEntry } from '../types/auditLog';
import { ROUTES } from '@/app/router/routes';
import { BsDateRangePicker } from '@/shared/components/BsDateRangePicker';
import { DataTable } from '@/shared/components/data-table/DataTable';
import { PageContainer } from '@/shared/components/layout/PageContainer';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { cn } from '@/shared/lib/utils';

const TABS = [
  { to: ROUTES.PLATFORM_SCHOOLS, label: 'Schools' },
  { to: ROUTES.PLATFORM_AUDIT_LOG, label: 'Audit Log' },
];

const PER_PAGE = 25;

export default function AuditLogPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('all');
  const [actorFilter, setActorFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const [viewingEntry, setViewingEntry] = useState<AuditLogEntry | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(id);
  }, [search]);

  const schoolsQuery = useSchools();
  const actionsQuery = useAuditLogActions();
  const actorsQuery = useAuditLogActors();

  const logsQuery = useAuditLogs({
    page: pageIndex + 1,
    per_page: PER_PAGE,
    search: debouncedSearch || undefined,
    school_id: schoolFilter !== 'all' ? Number(schoolFilter) : undefined,
    actor_user_id: actorFilter !== 'all' ? Number(actorFilter) : undefined,
    action: actionFilter !== 'all' ? actionFilter : undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  });

  const columns = useMemo(() => buildAuditLogColumns({ onViewDetails: setViewingEntry }), []);

  function resetPage() {
    setPageIndex(0);
  }

  return (
    <PageContainer
      title="Audit Log"
      description="Who did what, when — every consequential action across every school."
    >
      <div className="flex gap-1 border-b">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              cn(
                'border-b-2 border-transparent px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
                isActive && 'border-primary text-foreground',
              )
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={logsQuery.data?.data ?? []}
        isLoading={logsQuery.isLoading}
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          resetPage();
        }}
        searchPlaceholder="Search by action or entity"
        pageIndex={pageIndex}
        pageCount={logsQuery.data?.last_page ?? 1}
        onPageChange={setPageIndex}
        totalCount={logsQuery.data?.total}
        emptyTitle="No audit log entries match these filters"
        filters={
          <>
            <Select
              value={schoolFilter}
              onValueChange={(value) => {
                setSchoolFilter(value);
                resetPage();
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All schools" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All schools</SelectItem>
                {schoolsQuery.data?.map((school) => (
                  <SelectItem key={school.id} value={String(school.id)}>
                    {school.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={actorFilter}
              onValueChange={(value) => {
                setActorFilter(value);
                resetPage();
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All actors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actors</SelectItem>
                {actorsQuery.data?.map((actor) => (
                  <SelectItem key={actor.id} value={String(actor.id)}>
                    {actor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={actionFilter}
              onValueChange={(value) => {
                setActionFilter(value);
                resetPage();
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                {actionsQuery.data?.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="w-56">
              <BsDateRangePicker
                startValue={dateFrom}
                endValue={dateTo}
                onChange={(start, end) => {
                  setDateFrom(start);
                  setDateTo(end);
                  resetPage();
                }}
              />
            </div>
          </>
        }
      />

      <AuditLogDetailDialog entry={viewingEntry} onOpenChange={(open) => !open && setViewingEntry(null)} />
    </PageContainer>
  );
}
