import { Check, Copy, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';

interface PasswordRevealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  password: string | null;
  title?: string;
}

/**
 * The one-time-display pattern for a generated password: shown exactly
 * once here, copyable, never retrievable again afterward — the backend
 * never returns it in any later response, and this dialog is the only
 * place it's ever rendered.
 */
export function PasswordRevealDialog({
  open,
  onOpenChange,
  password,
  title = 'Temporary password',
}: PasswordRevealDialogProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    if (!password) {
      return;
    }
    void navigator.clipboard.writeText(password).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-3 font-mono text-lg">
          <span className="flex-1 select-all">{password}</span>
          <Button type="button" variant="outline" size="icon-sm" onClick={handleCopy}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          </Button>
        </div>

        <div className="flex items-start gap-2 rounded-md border border-amber-400 bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <p>
            Copy this now and share it with the staff member directly — it will not be shown again,
            and there is no way to retrieve it later.
          </p>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
