import { Upload } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUploadImport } from '../hooks/useUploadImport';
import { studentImportBatchPath } from '@/app/router/routes';
import { ForbiddenState } from '@/shared/components/feedback/ForbiddenState';
import { PageContainer } from '@/shared/components/layout/PageContainer';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { useCan } from '@/shared/hooks/useCan';

export default function ImportPage() {
  const navigate = useNavigate();
  const uploadImport = useUploadImport();
  const [file, setFile] = useState<File | null>(null);
  const canManage = useCan(['super_admin', 'admin']);

  function handleUpload() {
    if (!file) {
      return;
    }
    uploadImport.mutate(file, {
      onSuccess: (batch) => navigate(studentImportBatchPath(batch.id)),
    });
  }

  if (!canManage) {
    return (
      <PageContainer title="Import Students">
        <ForbiddenState />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Import Students"
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
          <Button onClick={handleUpload} disabled={!file || uploadImport.isPending}>
            {uploadImport.isPending ? 'Parsing file — this can take a few seconds…' : 'Upload and parse'}
          </Button>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
