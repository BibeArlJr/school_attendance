import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type RowSelectionState,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowUpDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { LoadingSkeleton } from '@/shared/components/feedback/LoadingSkeleton';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';

export interface BulkDeleteResult {
  deletedCount: number;
  blocked: { label: string; reason: string }[];
}

interface DataTableSelection<TData> {
  /**
   * Delete every selected row through its entity's existing single-delete
   * endpoint (one call per row) and report back what happened — see
   * shared/hooks/useBulkDelete. Never a dedicated bulk-delete endpoint,
   * so the Phase 11 per-row safety checks always apply.
   */
  onDeleteSelected: (rows: TData[]) => Promise<BulkDeleteResult>;
  /**
   * Fetches every row matching the current search/filter (not just the
   * current page) — reusing the entity's existing paginated list
   * endpoint with a high `per_page`, not a new ids-only or bulk-delete
   * endpoint. Omit to disable "select all matching" entirely (e.g.
   * Classes, whose list is never paginated in the first place).
   */
  fetchAllMatching?: () => Promise<TData[]>;
  /** e.g. "students" — used in the select-all-matching prompt and confirm dialog copy. */
  entityLabelPlural?: string;
}

interface DataTableProps<TData extends { id: number }, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  /** Controlled search input — debounce/wiring is the caller's responsibility. */
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  /** Server-side pagination — the backend already paginates. */
  pageIndex: number;
  pageCount: number;
  onPageChange: (pageIndex: number) => void;
  totalCount?: number;
  /** Extra column-based filter controls (selects, etc), rendered next to search. */
  filters?: ReactNode;
  /** Row-independent actions (e.g. "Add Student"), rendered top-right. */
  actions?: ReactNode;
  emptyTitle?: string;
  /**
   * Adds a checkbox column and a "N selected — Delete Selected" bar.
   * Omit entirely to hide bulk-select — e.g. for a role that doesn't
   * have single-delete permission on this entity, matching the existing
   * per-row delete UI's own RBAC gating.
   */
  selection?: DataTableSelection<TData>;
}

/**
 * Generic, reusable table: TanStack Table + shadcn table primitives.
 * Sorting is client-side over the current page (the backend paginates,
 * not sorts); everything else — search, filters, page navigation — is
 * fully controlled by the caller, so this has no opinion about what
 * "search" or "filter" mean for any given entity. Reference
 * implementation for Teachers/Parents/Reports to reuse later.
 */
export function DataTable<TData extends { id: number }, TValue>({
  columns,
  data,
  isLoading,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  pageIndex,
  pageCount,
  onPageChange,
  totalCount,
  filters,
  actions,
  emptyTitle = 'No results',
  selection,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [result, setResult] = useState<BulkDeleteResult | null>(null);
  // Set once the user confirms "select all N matching rows" — holds every
  // matching row (fetched beyond just this page), not just what's
  // rendered. Takes over from the page-scoped rowSelection state below
  // while active; null means "use whatever's checked on this page".
  const [expandedSelection, setExpandedSelection] = useState<TData[] | null>(null);
  const [isFetchingAll, setIsFetchingAll] = useState(false);

  // Selection is tied to a specific page/filter's rows — any navigation
  // that changes what `data` holds (page change, search, filter) must
  // not leave stale, now-invisible rows "selected" underneath.
  useEffect(() => {
    setRowSelection({});
    setExpandedSelection(null);
  }, [pageIndex, data]);

  const tableColumns: ColumnDef<TData, TValue>[] = selection
    ? [
        {
          id: '__select__',
          header: ({ table }) => (
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected()
                  ? true
                  : table.getIsSomePageRowsSelected()
                    ? 'indeterminate'
                    : false
              }
              onCheckedChange={(value) => table.toggleAllPageRowsSelected(value === true)}
              aria-label="Select all rows on this page"
            />
          ),
          cell: ({ row }) => (
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(value === true)}
              aria-label="Select row"
            />
          ),
          enableSorting: false,
        } as ColumnDef<TData, TValue>,
        ...columns,
      ]
    : columns;

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getRowId: (row) => String(row.id),
    enableRowSelection: !!selection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount,
  });

  const selectedRows = table.getSelectedRowModel().rows.map((row) => row.original);
  const effectiveSelectedRows = expandedSelection ?? selectedRows;

  const canOfferSelectAllMatching =
    !!selection?.fetchAllMatching &&
    expandedSelection === null &&
    selectedRows.length > 0 &&
    selectedRows.length === data.length &&
    totalCount !== undefined &&
    totalCount > data.length;

  async function handleSelectAllMatching() {
    if (!selection?.fetchAllMatching) {
      return;
    }
    setIsFetchingAll(true);
    const rows = await selection.fetchAllMatching();
    setIsFetchingAll(false);
    setExpandedSelection(rows);
  }

  async function handleConfirmBulkDelete() {
    if (!selection) {
      return;
    }
    setIsBulkDeleting(true);
    const outcome = await selection.onDeleteSelected(effectiveSelectedRows);
    setIsBulkDeleting(false);
    setConfirmOpen(false);
    setRowSelection({});
    setExpandedSelection(null);
    setResult(outcome);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={searchPlaceholder}
              className="pl-8"
            />
          </div>
          {filters}
        </div>
        {actions}
      </div>

      {selection && effectiveSelectedRows.length > 0 && (
        <div className="flex items-center justify-between rounded-md border bg-muted/50 px-4 py-2">
          <span className="text-sm font-medium">
            {expandedSelection
              ? `All ${expandedSelection.length} matching rows selected`
              : `${selectedRows.length} selected`}
          </span>
          <div className="flex items-center gap-2">
            {expandedSelection && (
              <Button variant="ghost" size="sm" onClick={() => setExpandedSelection(null)}>
                Clear
              </Button>
            )}
            <Button variant="destructive" size="sm" onClick={() => setConfirmOpen(true)}>
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {canOfferSelectAllMatching && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-primary/30 bg-primary/5 px-4 py-2 text-sm">
          <span>
            All {data.length} on this page selected. Select all {totalCount} rows matching your
            current search/filter?
          </span>
          <Button size="sm" variant="outline" onClick={handleSelectAllMatching} disabled={isFetchingAll}>
            {isFetchingAll ? 'Loading…' : `Select all ${totalCount}`}
          </Button>
        </div>
      )}

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <button
                        type="button"
                        className="flex items-center gap-1 font-medium"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <ArrowUpDown className="size-3.5 text-muted-foreground" />
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={tableColumns.length} className="p-6">
                  <LoadingSkeleton lines={4} />
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={tableColumns.length} className="p-6">
                  <EmptyState title={emptyTitle} />
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() ? 'selected' : undefined}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{totalCount !== undefined ? `${totalCount} total` : null}</span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pageIndex - 1)}
            disabled={pageIndex <= 0}
          >
            <ChevronLeft className="size-4" />
            Previous
          </Button>
          <span>
            Page {pageIndex + 1} of {Math.max(pageCount, 1)}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pageIndex + 1)}
            disabled={pageIndex + 1 >= pageCount}
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {selection && (
        <>
          <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete {effectiveSelectedRows.length} selected?</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                Attempting to delete {effectiveSelectedRows.length} matching{' '}
                {selection.entityLabelPlural ?? 'rows'} — each is deleted independently, exactly as
                a single delete would; records with attendance history or other dependencies will
                be skipped and reported, not silently removed.
              </p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleConfirmBulkDelete} disabled={isBulkDeleting}>
                  {isBulkDeleting ? 'Deleting…' : 'Delete Selected'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={result !== null} onOpenChange={(open) => !open && setResult(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bulk delete results</DialogTitle>
              </DialogHeader>
              {result && (
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-semibold text-emerald-600">{result.deletedCount}</span> deleted
                    {result.blocked.length > 0 && (
                      <>
                        , <span className="font-semibold text-amber-600">{result.blocked.length}</span>{' '}
                        blocked
                      </>
                    )}
                  </p>
                  {result.blocked.length > 0 && (
                    <ul className="list-inside list-disc space-y-1 rounded-md border border-amber-400/50 bg-amber-50 p-3 dark:bg-amber-950/40">
                      {result.blocked.map((item, index) => (
                        <li key={index}>
                          <span className="font-medium">{item.label}:</span> {item.reason}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              <DialogFooter>
                <Button onClick={() => setResult(null)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
