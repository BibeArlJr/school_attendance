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
  // Decoupled from any specific owner type (restored, Rebuild Staff
  // Module Part G) — the caller supplies its own reissue mutation
  // (useReissueIdCard for a student, useReissueStaffIdCard for staff),
  // this dialog just confirms and fires it. Previously hardcoded to a
  // student uuid + useReissueIdCard internally.
  onConfirm: () => void;
  isPending: boolean;
}

export function ReissueCardDialog({ open, onOpenChange, onConfirm, isPending }: ReissueCardDialogProps) {
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
          <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending ? 'Reissuing…' : 'Reissue card'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
