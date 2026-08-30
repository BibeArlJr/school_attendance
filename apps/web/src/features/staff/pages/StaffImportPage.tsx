import { Upload } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUploadStaffImport } from '../hooks/useUploadStaffImport';
import { staffImportBatchPath } from '@/app/router/routes';
import { ForbiddenState } from '@/shared/components/feedback/ForbiddenState';
import { PageContainer } from '@/shared/components/layout/PageContainer';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { useCan } from '@/shared/hooks/useCan';
import { LICENSE_EXPIRED_MESSAGE, useLicenseExpired } from '@/shared/hooks/useLicenseExpired';

export default function StaffImportPage() {
  const navigate = useNavigate();
  const uploadImport = useUploadStaffImport();
  const [file, setFile] = useState<File | null>(null);
  const canManage = useCan(['super_admin', 'admin']);
  const licenseExpired = useLicenseExpired(canManage);

  function handleUpload() {
    if (!file) {
      return;
    }
    uploadImport.mutate(file, {
      onSuccess: (batch) => navigate(staffImportBatchPath(batch.id)),
    });
  }

  if (!canManage) {
    return (
      <PageContainer title="Import Staff">
        <ForbiddenState />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Import Staff"
      description="Upload an Excel roster (.xls/.xlsx) — you'll review and resolve every row before anything is created."
    >
      <Card className="mx-auto max-w-lg">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <Upload className="size-10 text-muted-foreground" />
          <Input
            type="file"
            accept=".xls,.xlsx"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="max-w-xs"
          />
          {file && <p className="text-sm text-muted-foreground">{file.name}</p>}
          <Button
            onClick={handleUpload}
            disabled={!file || uploadImport.isPending || licenseExpired}
            title={licenseExpired ? LICENSE_EXPIRED_MESSAGE : undefined}
          >
            {uploadImport.isPending ? 'Parsing file — this can take a few seconds…' : 'Upload and parse'}
          </Button>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
