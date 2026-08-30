import { Pencil, Printer, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { StaffFormDialog } from '../components/StaffFormDialog';
import { useStaffMember } from '../hooks/useStaffMember';
import { useAuthStore } from '@/features/auth/store/authStore';
import { IdCardView } from '@/features/idcards/components/IdCardView';
import { ReissueCardDialog } from '@/features/idcards/components/ReissueCardDialog';
import { useReissueStaffIdCard } from '@/features/idcards/hooks/useReissueStaffIdCard';
import { useStaffIdCard } from '@/features/idcards/hooks/useStaffIdCard';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { LoadingSkeleton } from '@/shared/components/feedback/LoadingSkeleton';
import { PageContainer } from '@/shared/components/layout/PageContainer';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { useCan } from '@/shared/hooks/useCan';
import { LICENSE_EXPIRED_MESSAGE, useLicenseExpired } from '@/shared/hooks/useLicenseExpired';

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  active: 'default',
  on_leave: 'secondary',
  resigned: 'outline',
};

export default function StaffDetailPage() {
  const { id } = useParams<{ id: string }>();
  const staffUuid = id ?? '';
  const staffQuery = useStaffMember(staffUuid);
  const cardQuery = useStaffIdCard(staffUuid);
  const reissueCard = useReissueStaffIdCard(staffUuid);
  const schoolName = useAuthStore((state) => state.user?.school?.name) ?? 'Your School';
  const schoolLogoUrl = useAuthStore((state) => state.branding?.logo_url);
  const canManage = useCan(['super_admin', 'admin']);
  const licenseExpired = useLicenseExpired(canManage);
  const [formOpen, setFormOpen] = useState(false);
  const [reissueOpen, setReissueOpen] = useState(false);

  if (staffQuery.isLoading) {
    return (
      <PageContainer title="Staff">
        <LoadingSkeleton lines={4} />
      </PageContainer>
    );
  }

  const staff = staffQuery.data;
  if (!staff) {
    return (
      <PageContainer title="Staff">
        <EmptyState title="Staff member not found" />
      </PageContainer>
    );
  }

  return (
    <PageContainer title={staff.name} description={staff.designation ?? undefined}>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Staff info</CardTitle>
            {canManage && (
              <Button
                variant="outline"
                size="sm"
                disabled={licenseExpired}
                title={licenseExpired ? LICENSE_EXPIRED_MESSAGE : undefined}
                onClick={() => setFormOpen(true)}
              >
                <Pencil className="size-4" />
                Edit
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">Designation:</span> {staff.designation ?? '—'}
            </p>
            <p>
              <span className="text-muted-foreground">Rank:</span> {staff.rank ?? '—'}
            </p>
            <p>
              <span className="text-muted-foreground">Level:</span> {staff.level ?? '—'}
            </p>
            <p>
              <span className="text-muted-foreground">Sheet Roll No.:</span>{' '}
              {staff.sheet_roll_no ?? '—'}
            </p>
            <p>
              <span className="text-muted-foreground">Mobile:</span> {staff.mobile ?? '—'}
            </p>
            <p>
              <span className="text-muted-foreground">Date of Birth (BS):</span>{' '}
              {staff.dob_bs ?? '—'}
            </p>
            <p>
              <span className="text-muted-foreground">Citizenship Number:</span>{' '}
              {staff.citizenship_number ?? '—'}
            </p>
            <p>
              <span className="text-muted-foreground">Address:</span> {staff.address ?? '—'}
            </p>
            <p className="flex items-center gap-2">
              <span className="text-muted-foreground">Employment status:</span>
              <Badge variant={STATUS_VARIANT[staff.employment_status]} className="capitalize">
                {staff.employment_status.replace('_', ' ')}
              </Badge>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>ID Card</CardTitle>
            {cardQuery.data && (
              <div className="flex gap-2 print:hidden">
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  <Printer className="size-4" />
                  Print
                </Button>
                {canManage && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={licenseExpired}
                    title={licenseExpired ? LICENSE_EXPIRED_MESSAGE : undefined}
                    onClick={() => setReissueOpen(true)}
                  >
                    <RotateCcw className="size-4" />
                    Reissue
                  </Button>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent>
            {cardQuery.isLoading ? (
              <LoadingSkeleton lines={3} />
            ) : cardQuery.data ? (
              <IdCardView card={cardQuery.data} schoolName={schoolName} schoolLogoUrl={schoolLogoUrl} />
            ) : (
              <EmptyState title="No ID card found for this staff member" />
            )}
          </CardContent>
        </Card>
      </div>

      {canManage && (
        <StaffFormDialog open={formOpen} onOpenChange={setFormOpen} staff={staff} licenseExpired={licenseExpired} />
      )}

      {canManage && (
        <ReissueCardDialog
          open={reissueOpen}
          onOpenChange={setReissueOpen}
          isPending={reissueCard.isPending}
          onConfirm={() => reissueCard.mutate(undefined, { onSuccess: () => setReissueOpen(false) })}
        />
      )}
    </PageContainer>
  );
}
