import { useReissueIdCard } from '../hooks/useReissueIdCard';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';

interface ReissueCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
}

export function ReissueCardDialog({ open, onOpenChange, studentId }: ReissueCardDialogProps) {
  const reissueCard = useReissueIdCard(studentId);

  function confirm() {
    void reissueCard.mutateAsync().then(() => onOpenChange(false));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reissue ID card?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This deactivates the current card — its QR code will no longer scan as valid — and
          issues a brand new one. Use this for a lost or damaged card.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={confirm} disabled={reissueCard.isPending}>
            {reissueCard.isPending ? 'Reissuing…' : 'Reissue card'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
