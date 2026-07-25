import { Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { staffApi } from '../api/staffApi';
import { PasswordRevealDialog } from '../components/PasswordRevealDialog';
import { buildStaffColumns } from '../components/staffColumns';
import { StaffFormDialog } from '../components/StaffFormDialog';
import { useDeleteStaff } from '../hooks/useDeleteStaff';
import { useResetPassword } from '../hooks/useResetPassword';
import { useStaffList } from '../hooks/useStaffList';
import type { Staff } from '../types';
import { DataTable } from '@/shared/components/data-table/DataTable';
import { DeleteConfirmDialog } from '@/shared/components/DeleteConfirmDialog';
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

const DELETE_ENTITY_LABEL: Record<Staff['role'], string> = {
  teacher: 'teacher',
  guard: 'guard',
  admin: 'admin',
};

export default function StaffPage() {
  const canManage = useCan(['super_admin', 'admin']);
  const licenseExpired = useLicenseExpired(canManage);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [pageIndex, setPageIndex] = useState(0);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [revealPassword, setRevealPassword] = useState<string | null>(null);
  const [deletingStaff, setDeletingStaff] = useState<Staff | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const resetPassword = useResetPassword();
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

  function handleRoleFilterChange(value: string) {
    setRoleFilter(value);
    setPageIndex(0);
  }

  // Role filter deliberately still offers "Teacher" (Prompt 34 Part A
  // only removes it from the create form) — existing (now-resigned)
  // teacher accounts stay visible/filterable in this list, per Part A's
  // "historical records, not deleted" requirement.
  const staffQuery = useStaffList({
    page: pageIndex + 1,
    per_page: PER_PAGE,
    search: debouncedSearch || undefined,
    employment_status: statusFilter !== 'all' ? statusFilter : undefined,
    role: roleFilter !== 'all' ? roleFilter : undefined,
  });

  const columns = useMemo(
    () =>
      buildStaffColumns({
        licenseExpired,
        onEdit: (staff) => {
          setEditingStaff(staff);
          setFormOpen(true);
        },
        onResetPassword: (staff) =>
          resetPassword.mutate(staff.uuid, {
            onSuccess: (temporaryPassword) => setRevealPassword(temporaryPassword),
          }),
        onDeleteRequest: (staff) => {
          setDeletingStaff(staff);
          setDeleteDialogOpen(true);
        },
      }),
    [resetPassword, licenseExpired],
  );

  function handleDeleteOpenChange(nextOpen: boolean) {
    setDeleteDialogOpen(nextOpen);
    if (!nextOpen) {
      deleteStaff.reset();
    }
  }

  return (
    <div className="mt-4">
      <DataTable
        columns={columns}
        data={staffQuery.data?.data ?? []}
        isLoading={staffQuery.isLoading}
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search by name or email"
        pageIndex={pageIndex}
        pageCount={staffQuery.data?.last_page ?? 1}
        onPageChange={setPageIndex}
        totalCount={staffQuery.data?.total}
        emptyTitle="No staff found"
        selection={
          canManage
            ? {
                onDeleteSelected: (rows) => bulkDelete(rows, (staff) => staff.uuid),
                entityLabelPlural: 'staff',
                fetchAllMatching: async () => {
                  const total = staffQuery.data?.total ?? 0;
                  if (total === 0) {
                    return [];
                  }
                  const result = await staffApi.list({
                    per_page: total,
                    search: debouncedSearch || undefined,
                    employment_status: statusFilter !== 'all' ? statusFilter : undefined,
                    role: roleFilter !== 'all' ? roleFilter : undefined,
                  });
                  return result.data;
                },
              }
            : undefined
        }
        filters={
          <>
            <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="guard">Guard</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
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
          </>
        }
        actions={
          canManage ? (
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

      <PasswordRevealDialog
        open={revealPassword !== null}
        onOpenChange={(nextOpen) => !nextOpen && setRevealPassword(null)}
        password={revealPassword}
        title="Password reset"
      />

      {canManage && (
        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={handleDeleteOpenChange}
          entityLabel={deletingStaff ? DELETE_ENTITY_LABEL[deletingStaff.role] : 'staff member'}
          alternativeActionHint="If this staff member actually left the school, use the employment status menu instead — delete is only for records added by mistake."
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
    </div>
  );
}
