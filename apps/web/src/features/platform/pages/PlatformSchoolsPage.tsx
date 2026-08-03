import { Plus } from 'lucide-react';
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { CreateSchoolFormDialog } from '../components/CreateSchoolFormDialog';
import { SubscriptionManageDialog } from '../components/SubscriptionManageDialog';
import { useSchools } from '../hooks/useSchools';
import { useSetActiveSchool } from '../hooks/useSetActiveSchool';
import { useDeactivateSchool, useDeleteSchool, useReactivateSchool } from '../hooks/useSubscriptionMutations';
import type { LicenseStatusValue, PlatformSchool } from '../types';
import { ROUTES } from '@/app/router/routes';
import { useAuthStore } from '@/features/auth/store/authStore';
import { DeleteConfirmDialog } from '@/shared/components/DeleteConfirmDialog';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { LoadingSkeleton } from '@/shared/components/feedback/LoadingSkeleton';
import { PageContainer } from '@/shared/components/layout/PageContainer';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { extractErrorMessage } from '@/shared/lib/errors';
import { cn } from '@/shared/lib/utils';

const TABS = [
  { to: ROUTES.PLATFORM_SCHOOLS, label: 'Schools' },
  { to: ROUTES.PLATFORM_AUDIT_LOG, label: 'Audit Log' },
];

const LICENSE_LABEL: Record<LicenseStatusValue, string> = {
  active: 'Active',
  grace: 'Grace period',
  expired: 'Expired',
};

const LICENSE_VARIANT: Record<LicenseStatusValue, 'default' | 'secondary' | 'outline'> = {
  active: 'default',
  grace: 'secondary',
  expired: 'outline',
};

export default function PlatformSchoolsPage() {
  const schoolsQuery = useSchools();
  const setActiveSchool = useSetActiveSchool();
  const deactivateSchool = useDeactivateSchool();
  const reactivateSchool = useReactivateSchool();
  const deleteSchool = useDeleteSchool();
  const activeSchoolId = useAuthStore((state) => state.user?.active_school?.id);
  const [formOpen, setFormOpen] = useState(false);
  const [managingSchoolId, setManagingSchoolId] = useState<number | null>(null);
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  const [deletingSchoolId, setDeletingSchoolId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  // Derived from live query data (not a stale snapshot) so the dialog's
  // status/expiry display refreshes automatically after each mutation —
  // every subscription mutation invalidates ['platform', 'schools'].
  const managingSchool: PlatformSchool | null =
    schoolsQuery.data?.find((s) => s.id === managingSchoolId) ?? null;
  const deletingSchool: PlatformSchool | null =
    schoolsQuery.data?.find((s) => s.id === deletingSchoolId) ?? null;

  function handleDeleteOpenChange(nextOpen: boolean) {
    setDeleteDialogOpen(nextOpen);
    if (!nextOpen) {
      deleteSchool.reset();
    }
  }

  return (
    <PageContainer
      title="Platform Console"
      description="Create and manage every school on this platform, and pick which one you're currently operating as."
    >
      <div className="flex gap-1 border-b">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end
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

      <div className="flex justify-end">
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="size-4" />
          Create School
        </Button>
      </div>

      {schoolsQuery.isLoading ? (
        <LoadingSkeleton lines={4} />
      ) : schoolsQuery.isError ? (
        <ErrorState onRetry={() => schoolsQuery.refetch()} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Students</TableHead>
              <TableHead>Staff</TableHead>
              <TableHead>License</TableHead>
              <TableHead>Days Remaining</TableHead>
              <TableHead>Created</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {schoolsQuery.data?.map((school) => (
              <TableRow key={school.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {school.name}
                    {activeSchoolId === school.id && <Badge>Managing</Badge>}
                    {!school.is_active && <Badge variant="destructive">Suspended</Badge>}
                  </div>
                </TableCell>
                <TableCell>{school.school_code}</TableCell>
                <TableCell>{school.students_count}</TableCell>
                <TableCell>{school.staff_count}</TableCell>
                <TableCell>
                  <Badge variant={LICENSE_VARIANT[school.computed_license_status]} className="w-fit">
                    {LICENSE_LABEL[school.computed_license_status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {/* Computed live from amc_expiry_date server-side
                      (days_until_expiry, already returned by every
                      schools-list/detail response) — not reimplemented
                      here, just displayed (Prompt 36 Part C). */}
                  {school.days_until_expiry === null ? (
                    <span className="text-muted-foreground">—</span>
                  ) : school.days_until_expiry < 0 ? (
                    <span className="font-medium text-destructive">
                      Expired {Math.abs(school.days_until_expiry)}d ago
                    </span>
                  ) : (
                    <span>{school.days_until_expiry}d</span>
                  )}
                </TableCell>
                <TableCell>{school.created_at.slice(0, 10)}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setManagingSchoolId(school.id);
                        setSubscriptionDialogOpen(true);
                      }}
                    >
                      Manage Subscription
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={activeSchoolId === school.id || setActiveSchool.isPending}
                      onClick={() => setActiveSchool.mutate(school.id)}
                    >
                      {activeSchoolId === school.id ? 'Managing this school' : 'Manage this school'}
                    </Button>
                    {school.is_active ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={deactivateSchool.isPending}
                        onClick={() => deactivateSchool.mutate(school.id)}
                      >
                        Deactivate
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={reactivateSchool.isPending}
                          onClick={() => reactivateSchool.mutate(school.id)}
                        >
                          Reactivate
                        </Button>
                        {/* Only reachable once already deactivated — the
                            backend independently enforces this same gate
                            (plus zero real students/staff) regardless of
                            what this button's disabled state allows. */}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setDeletingSchoolId(school.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <CreateSchoolFormDialog open={formOpen} onOpenChange={setFormOpen} />
      <SubscriptionManageDialog
        school={managingSchool}
        open={subscriptionDialogOpen}
        onOpenChange={setSubscriptionDialogOpen}
      />
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={handleDeleteOpenChange}
        entityLabel={deletingSchool ? `school "${deletingSchool.name}"` : 'school'}
        alternativeActionHint="This only works for a school with zero real students or staff — it's for undoing a mistaken creation, not removing an active school."
        isPending={deleteSchool.isPending}
        errorMessage={deleteSchool.isError ? extractErrorMessage(deleteSchool.error) : null}
        onConfirm={() => {
          if (!deletingSchool) return;
          deleteSchool.mutate(deletingSchool.id, {
            onSuccess: () => setDeleteDialogOpen(false),
          });
        }}
      />
    </PageContainer>
  );
}
