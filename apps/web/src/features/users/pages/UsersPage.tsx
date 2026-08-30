import { Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { usersApi } from '../api/usersApi';
import { PasswordRevealDialog } from '../components/PasswordRevealDialog';
import { UserFormDialog } from '../components/UserFormDialog';
import { buildUserColumns } from '../components/userColumns';
import { useDeleteUser } from '../hooks/useDeleteUser';
import { useResetPassword } from '../hooks/useResetPassword';
import { useUserList } from '../hooks/useUserList';
import type { UserAccount } from '../types';
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

const DELETE_ENTITY_LABEL: Record<UserAccount['role'], string> = {
  teacher: 'teacher',
  guard: 'guard',
  admin: 'admin',
};

export default function UsersPage() {
  const canManage = useCan(['super_admin', 'admin']);
  const licenseExpired = useLicenseExpired(canManage);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [pageIndex, setPageIndex] = useState(0);
  const [editingAccount, setEditingAccount] = useState<UserAccount | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [revealPassword, setRevealPassword] = useState<string | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<UserAccount | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const resetPassword = useResetPassword();
  const deleteUser = useDeleteUser();
  const { bulkDelete } = useBulkDelete<UserAccount>({
    queryKey: ['users'],
    deleteFn: usersApi.delete,
    getLabel: (account) => account.name,
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

  // Role filter deliberately still offers "Teacher" — existing
  // (now-resigned) teacher accounts stay visible/filterable in this
  // list, as historical records, not deleted.
  const usersQuery = useUserList({
    page: pageIndex + 1,
    per_page: PER_PAGE,
    search: debouncedSearch || undefined,
    employment_status: statusFilter !== 'all' ? statusFilter : undefined,
    role: roleFilter !== 'all' ? roleFilter : undefined,
  });

  const columns = useMemo(
    () =>
      buildUserColumns({
        licenseExpired,
        onEdit: (account) => {
          setEditingAccount(account);
          setFormOpen(true);
        },
        onResetPassword: (account) =>
          resetPassword.mutate(account.uuid, {
            onSuccess: (temporaryPassword) => setRevealPassword(temporaryPassword),
          }),
        onDeleteRequest: (account) => {
          setDeletingAccount(account);
          setDeleteDialogOpen(true);
        },
      }),
    [resetPassword, licenseExpired],
  );

  function handleDeleteOpenChange(nextOpen: boolean) {
    setDeleteDialogOpen(nextOpen);
    if (!nextOpen) {
      deleteUser.reset();
    }
  }

  return (
    <PageContainer title="Users" description="Manage admin and guard login accounts.">
      <DataTable
        columns={columns}
        data={usersQuery.data?.data ?? []}
        isLoading={usersQuery.isLoading}
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search by name or email"
        pageIndex={pageIndex}
        pageCount={usersQuery.data?.last_page ?? 1}
        onPageChange={setPageIndex}
        totalCount={usersQuery.data?.total}
        emptyTitle="No users found"
        selection={
          canManage
            ? {
                onDeleteSelected: (rows) => bulkDelete(rows, (account) => account.uuid),
                entityLabelPlural: 'users',
                fetchAllMatching: async () => {
                  const total = usersQuery.data?.total ?? 0;
                  if (total === 0) {
                    return [];
                  }
                  const result = await usersApi.list({
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
                setEditingAccount(null);
                setFormOpen(true);
              }}
            >
              <Plus className="size-4" />
              Add User
            </Button>
          ) : undefined
        }
      />

      {canManage && (
        <UserFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          account={editingAccount}
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
          entityLabel={deletingAccount ? DELETE_ENTITY_LABEL[deletingAccount.role] : 'user'}
          alternativeActionHint="If this person actually left the school, use the employment status menu instead — delete is only for records added by mistake."
          isPending={deleteUser.isPending}
          errorMessage={deleteUser.isError ? extractErrorMessage(deleteUser.error) : null}
          onConfirm={() => {
            if (!deletingAccount) return;
            deleteUser.mutate(deletingAccount.uuid, {
              onSuccess: () => setDeleteDialogOpen(false),
            });
          }}
        />
      )}
    </PageContainer>
  );
}
