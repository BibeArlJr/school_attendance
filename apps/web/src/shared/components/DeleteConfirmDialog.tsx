import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** e.g. "student", "teacher", "parent", "class" — used in the title/body copy. */
  entityLabel: string;
  /**
   * The entity-specific alternative to point at — e.g. "If this person
   * actually left the school, use the status menu instead" for people,
   * or a class-appropriate equivalent. Combined with the shared
   * "permanent, cannot be undone" warning below.
   */
  alternativeActionHint: string;
  onConfirm: () => void;
  isPending: boolean;
  /**
   * Set after a blocked delete attempt — the exact message the backend
   * returned, shown verbatim, not a generic failure toast. Clearing this
   * is the caller's responsibility (e.g. on re-open).
   */
  errorMessage?: string | null;
}

/**
 * Shared across Students/Teachers/Parents/Classes (Prompt 11) — delete is
 * a distinct, rarer action from the existing status-change menus, and
 * this dialog's copy makes that distinction explicit every time.
 */
export function DeleteConfirmDialog({
  open,
  onOpenChange,
  entityLabel,
  alternativeActionHint,
  onConfirm,
  isPending,
  errorMessage,
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="capitalize">Delete this {entityLabel}?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This permanently deletes this {entityLabel} — it cannot be undone. {alternativeActionHint}
        </p>
        {errorMessage && (
          <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
            {errorMessage}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending ? 'Deleting…' : 'Delete permanently'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
