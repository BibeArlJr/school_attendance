import { Plus, Upload } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { staffApi } from '../api/staffApi';
import { buildStaffColumns } from '../components/staffColumns';
import { StaffFormDialog } from '../components/StaffFormDialog';
import { useDeleteStaff } from '../hooks/useDeleteStaff';
import { useStaffList } from '../hooks/useStaffList';
import type { Staff } from '../types';
import { ROUTES } from '@/app/router/routes';
import { DataTable } from '@/shared/components/data-table/DataTable';
import { DeleteConfirmDialog } from '@/shared/components/DeleteConfirmDialog';
import { PageContainer } from '@/shared/components/layout/PageContainer';
import { Button } from '@/shared/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { useBulkDelete } from '@/shared/hooks/useBulkDelete';
import { useCan } from '@/shared/hooks/useCan';
import { LICENSE_EXPIRED_MESSAGE, useLicenseExpired } from '@/shared/hooks/useLicenseExpired';
import { extractErrorMessage } from '@/shared/lib/errors';

const PER_PAGE = 10;

export default function StaffPage() {
  // Same single-Gate tier as Parents (Part G) — admin/super_admin only,
  // no teacher/guard access, matching the sensitivity of citizenship
  // numbers on this record.
  const canManage = useCan(['super_admin', 'admin']);
  const licenseExpired = useLicenseExpired(canManage);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pageIndex, setPageIndex] = useState(0);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deletingStaff, setDeletingStaff] = useState<Staff | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const deleteStaff = useDeleteStaff();
  const { bulkDelete } = useBulkDelete<Staff>({
    queryKey: ['staff'],
    deleteFn: staffApi.delete,
    getLabel: (staff) => staff.name,
  });

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(id);
  }, [search]);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPageIndex(0);
  }

  function handleStatusFilterChange(value: string) {
    setStatusFilter(value);
    setPageIndex(0);
  }

  const staffQuery = useStaffList({
    page: pageIndex + 1,
    per_page: PER_PAGE,
    search: debouncedSearch || undefined,
    employment_status: statusFilter !== 'all' ? statusFilter : undefined,
  });

  const columns = useMemo(
    () =>
      buildStaffColumns({
        licenseExpired,
        onEdit: (staff) => {
          setEditingStaff(staff);
          setFormOpen(true);
        },
        onDeleteRequest: (staff) => {
          setDeletingStaff(staff);
          setDeleteDialogOpen(true);
        },
      }),
    [licenseExpired],
  );

  function handleDeleteOpenChange(nextOpen: boolean) {
    setDeleteDialogOpen(nextOpen);
    if (!nextOpen) {
      deleteStaff.reset();
    }
  }

  return (
    <PageContainer
      title="Staff"
      description="Personnel records — designation, ID cards, and attendance. Independent of the Users login accounts."
    >
      <DataTable
        columns={columns}
        data={staffQuery.data?.data ?? []}
        isLoading={staffQuery.isLoading}
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search by name, designation, or citizenship number"
        pageIndex={pageIndex}
        pageCount={staffQuery.data?.last_page ?? 1}
        onPageChange={setPageIndex}
        totalCount={staffQuery.data?.total}
        emptyTitle="No staff members found"
        selection={
          canManage
            ? {
                onDeleteSelected: (rows) => bulkDelete(rows, (staff) => staff.uuid),
                entityLabelPlural: 'staff members',
                fetchAllMatching: async () => {
                  const total = staffQuery.data?.total ?? 0;
                  if (total === 0) {
                    return [];
                  }
                  const result = await staffApi.list({
                    per_page: total,
                    search: debouncedSearch || undefined,
                    employment_status: statusFilter !== 'all' ? statusFilter : undefined,
                  });
                  return result.data;
                },
              }
            : undefined
        }
        filters={
          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="on_leave">On Leave</SelectItem>
              <SelectItem value="resigned">Resigned</SelectItem>
            </SelectContent>
          </Select>
        }
        actions={
          canManage ? (
            <>
              <Button variant="outline" asChild>
                <Link to={ROUTES.STAFF_IMPORT}>
                  <Upload className="size-4" />
                  Import
                </Link>
              </Button>
              <Button
                disabled={licenseExpired}
                title={licenseExpired ? LICENSE_EXPIRED_MESSAGE : undefined}
                onClick={() => {
                  setEditingStaff(null);
                  setFormOpen(true);
                }}
              >
                <Plus className="size-4" />
                Add Staff Member
              </Button>
            </>
          ) : undefined
        }
      />

      {canManage && (
        <StaffFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          staff={editingStaff}
          licenseExpired={licenseExpired}
        />
      )}

      {canManage && (
        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={handleDeleteOpenChange}
          entityLabel="staff member"
          alternativeActionHint="If this person actually left the school, use the employment status menu instead — delete is blocked entirely once they have real attendance history."
          isPending={deleteStaff.isPending}
          errorMessage={deleteStaff.isError ? extractErrorMessage(deleteStaff.error) : null}
          onConfirm={() => {
            if (!deletingStaff) return;
            deleteStaff.mutate(deletingStaff.uuid, {
              onSuccess: () => setDeleteDialogOpen(false),
            });
          }}
        />
      )}
    </PageContainer>
  );
}
