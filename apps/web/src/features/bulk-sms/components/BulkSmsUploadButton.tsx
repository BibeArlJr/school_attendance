import { Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { usePreviewBulkSmsUpload } from '../hooks/usePreviewBulkSmsUpload';
import type { BulkSmsUploadPreviewResult } from '../types';
import { BulkSmsUploadPreviewDialog } from './BulkSmsUploadPreviewDialog';
import { Button } from '@/shared/components/ui/button';
import { extractErrorMessage } from '@/shared/lib/errors';

interface BulkSmsUploadButtonProps {
  onImported: () => void;
}

/**
 * Upload -> preview -> (review, all client-side) -> confirm. Nothing is
 * persisted until the preview dialog's "Import" is clicked — see
 * BulkSmsUploadPreviewDialog and BulkSmsUploadService::preview()'s own
 * docblock.
 */
export function BulkSmsUploadButton({ onImported }: BulkSmsUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUpload = usePreviewBulkSmsUpload();
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<BulkSmsUploadPreviewResult | null>(null);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Always clear the input so choosing the exact same file again still
    // fires onChange — otherwise a second attempt after canceling out of
    // the preview dialog would silently do nothing.
    event.target.value = '';
    if (!file) {
      return;
    }

    previewUpload.mutate(file, {
      onSuccess: (result) => {
        setFileName(file.name);
        setPreview(result);
      },
      onError: (error) => toast.error(extractErrorMessage(error)),
    });
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xls,.xlsx"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={previewUpload.isPending}>
        <Upload className="size-4" />
        {previewUpload.isPending ? 'Parsing file…' : 'Upload Contacts'}
      </Button>

      {preview && fileName && (
        <BulkSmsUploadPreviewDialog
          open
          onOpenChange={(open) => {
            if (!open) {
              setPreview(null);
              setFileName(null);
            }
          }}
          fileName={fileName}
          preview={preview}
          onImported={onImported}
        />
      )}
    </>
  );
}
