import { useState } from 'react';
import { useReissueTeacherIdCard } from '../hooks/useReissueTeacherIdCard';
import { useTeacherIdCard } from '../hooks/useTeacherIdCard';
import { BarcodeImage } from '@/features/idcards/components/BarcodeImage';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { LoadingSkeleton } from '@/shared/components/feedback/LoadingSkeleton';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';

interface StaffIdCardSectionProps {
  teacherId: string;
  canReissue: boolean;
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  active: 'default',
  lost: 'outline',
  deactivated: 'secondary',
};

export function StaffIdCardSection({ teacherId, canReissue }: StaffIdCardSectionProps) {
  const cardQuery = useTeacherIdCard(teacherId);
  const reissueCard = useReissueTeacherIdCard(teacherId);
  const [confirmOpen, setConfirmOpen] = useState(false);

  function confirmReissue() {
    void reissueCard.mutateAsync().then(() => setConfirmOpen(false));
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>ID Card</CardTitle>
        {canReissue && cardQuery.data && (
          <Button size="sm" variant="outline" onClick={() => setConfirmOpen(true)}>
            Reissue
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {cardQuery.isLoading ? (
          <LoadingSkeleton lines={2} />
        ) : !cardQuery.data ? (
          <EmptyState title="No ID card found" />
        ) : (
          <div className="flex items-center gap-4">
            <div className="rounded-md bg-white p-1">
              <BarcodeImage value={cardQuery.data.barcode_value} className="h-10" />
            </div>
            <Badge variant={STATUS_VARIANT[cardQuery.data.status]} className="capitalize">
              {cardQuery.data.status}
            </Badge>
          </div>
        )}
      </CardContent>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reissue ID card?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This deactivates the current card — its barcode will no longer scan as valid — and
            issues a brand new one. Use this for a lost or damaged card.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmReissue} disabled={reissueCard.isPending}>
              {reissueCard.isPending ? 'Reissuing…' : 'Reissue card'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
