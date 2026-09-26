import { useMemo, useState } from 'react';
import { useBulkSmsUploads } from '../hooks/useBulkSmsUploads';
import type { BulkSmsUpload } from '../types';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { formatDateTime12h } from '@/shared/lib/time';

const PER_PAGE = 5;

export function BulkSmsUploadHistorySection() {
  const [pageIndex, setPageIndex] = useState(0);
  const uploadsQuery = useBulkSmsUploads({ page: pageIndex + 1, per_page: PER_PAGE });

  const uploads = useMemo<BulkSmsUpload[]>(() => uploadsQuery.data?.data ?? [], [uploadsQuery.data]);

  if (!uploadsQuery.isLoading && uploads.length === 0 && pageIndex === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Upload History</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead>Rows</TableHead>
                <TableHead>Imported</TableHead>
                <TableHead>Skipped</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {uploads.map((upload) => (
                <TableRow key={upload.id}>
                  <TableCell>{upload.file_name}</TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatDateTime12h(upload.uploaded_at)}
                  </TableCell>
                  <TableCell>{upload.total_rows}</TableCell>
                  <TableCell className="text-emerald-600">{upload.imported_count}</TableCell>
                  <TableCell className="text-muted-foreground">{upload.skipped_count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageIndex((current) => current - 1)}
            disabled={pageIndex <= 0}
          >
            Previous
          </Button>
          <span>Page {pageIndex + 1} of {Math.max(uploadsQuery.data?.last_page ?? 1, 1)}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageIndex((current) => current + 1)}
            disabled={pageIndex + 1 >= (uploadsQuery.data?.last_page ?? 1)}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
