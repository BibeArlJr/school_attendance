import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useConfirmBulkSmsUpload } from '../hooks/useConfirmBulkSmsUpload';
import type { BulkSmsUploadPreviewResult, BulkSmsUploadRowStatus } from '../types';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { extractErrorMessage } from '@/shared/lib/errors';

const STATUS_VARIANT: Record<BulkSmsUploadRowStatus, 'default' | 'secondary' | 'outline'> = {
  valid: 'default',
  duplicate: 'secondary',
  invalid: 'outline',
};

interface BulkSmsUploadPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName: string;
  preview: BulkSmsUploadPreviewResult;
  onImported: () => void;
}

/**
 * Nothing here has been persisted yet — `preview` is exactly what
 * POST /bulk-sms/uploads/preview returned, held only in this component's
 * memory. Confirming sends back just the rows still checked; the server
 * re-normalizes and re-checks duplicates from scratch rather than
 * trusting anything computed here (see BulkSmsUploadService::confirm()).
 */
export function BulkSmsUploadPreviewDialog({
  open,
  onOpenChange,
  fileName,
  preview,
  onImported,
}: BulkSmsUploadPreviewDialogProps) {
  const confirmImport = useConfirmBulkSmsUpload();

  // Keyed by row_number — valid rows default checked, duplicate rows
  // default unchecked (already present, nothing to gain by re-sending
  // them), invalid rows can never be checked at all (not a real number,
  // regardless of intent).
  const [included, setIncluded] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(preview.rows.map((row) => [row.row_number, row.status === 'valid'])),
  );

  const includedCount = useMemo(
    () => preview.rows.filter((row) => row.status !== 'invalid' && included[row.row_number]).length,
    [preview.rows, included],
  );

  function toggleRow(rowNumber: number, checked: boolean) {
    setIncluded((prev) => ({ ...prev, [rowNumber]: checked }));
  }

  function handleConfirm() {
    const rows = preview.rows
      .filter((row) => row.status !== 'invalid' && included[row.row_number])
      .map((row) => ({ name: row.name, phone: row.phone_raw }));

    if (rows.length === 0) {
      return;
    }

    confirmImport.mutate(
      { fileName, rows },
      {
        onSuccess: (result) => {
          toast.success(
            `${result.created} contact${result.created === 1 ? '' : 's'} imported` +
              (result.skipped > 0 ? `, ${result.skipped} skipped.` : '.'),
          );
          onOpenChange(false);
          onImported();
        },
        onError: (error) => toast.error(extractErrorMessage(error)),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Review import — {fileName}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-4 gap-3 text-center text-sm">
          <div className="rounded-md border p-2">
            <p className="text-xs text-muted-foreground">Total rows</p>
            <p className="text-lg font-semibold">{preview.total_rows}</p>
          </div>
          <div className="rounded-md border p-2">
            <p className="text-xs text-muted-foreground">Valid</p>
            <p className="text-lg font-semibold text-emerald-600">{preview.valid_rows}</p>
          </div>
          <div className="rounded-md border p-2">
            <p className="text-xs text-muted-foreground">Invalid</p>
            <p className="text-lg font-semibold text-destructive">{preview.invalid_rows}</p>
          </div>
          <div className="rounded-md border p-2">
            <p className="text-xs text-muted-foreground">Duplicate</p>
            <p className="text-lg font-semibold text-amber-600">{preview.duplicate_rows}</p>
          </div>
        </div>

        {preview.skipped_sheets.length > 0 && (
          <div className="rounded-md border border-amber-400 bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            {preview.skipped_sheets.map((sheet) => (
              <p key={sheet.sheet_name}>
                &ldquo;{sheet.sheet_name}&rdquo; skipped: {sheet.reason}
              </p>
            ))}
          </div>
        )}

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>Row</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Original phone</TableHead>
                <TableHead>Normalized phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {preview.rows.map((row) => (
                <TableRow key={row.row_number}>
                  <TableCell>
                    <Checkbox
                      checked={row.status !== 'invalid' && (included[row.row_number] ?? false)}
                      disabled={row.status === 'invalid'}
                      onCheckedChange={(value) => toggleRow(row.row_number, value === true)}
                      aria-label={`Include row ${row.row_number}`}
                    />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{row.row_number}</TableCell>
                  <TableCell>{row.name ?? '—'}</TableCell>
                  <TableCell className="whitespace-nowrap">{row.phone_raw || '—'}</TableCell>
                  <TableCell className="whitespace-nowrap">{row.phone_normalized ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[row.status]} className="capitalize">
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{row.reason ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <DialogFooter className="items-center sm:justify-between">
          <span className="text-sm text-muted-foreground">
            {includedCount} row{includedCount === 1 ? '' : 's'} will be imported
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={includedCount === 0 || confirmImport.isPending}>
              {confirmImport.isPending ? 'Importing…' : `Import ${includedCount}`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
