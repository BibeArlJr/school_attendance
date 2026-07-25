import { Printer, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { IdCardView } from '../components/IdCardView';
import { ReissueCardDialog } from '../components/ReissueCardDialog';
import { useStudentIdCard } from '../hooks/useStudentIdCard';
import { useAuthStore } from '@/features/auth/store/authStore';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { LoadingSkeleton } from '@/shared/components/feedback/LoadingSkeleton';
import { PageContainer } from '@/shared/components/layout/PageContainer';
import { Button } from '@/shared/components/ui/button';
import { useCan } from '@/shared/hooks/useCan';

export default function IdCardPage() {
  const { id } = useParams<{ id: string }>();
  const studentId = id ?? '';
  const cardQuery = useStudentIdCard(studentId);
  const schoolName = useAuthStore((state) => state.user?.school?.name) ?? 'Your School';
  const schoolLogoUrl = useAuthStore((state) => state.branding?.logo_url);
  const canReissue = useCan(['super_admin', 'admin']);
  const [reissueOpen, setReissueOpen] = useState(false);

  if (cardQuery.isLoading) {
    return (
      <PageContainer title="ID Card">
        <LoadingSkeleton lines={4} />
      </PageContainer>
    );
  }

  const card = cardQuery.data;
  if (!card) {
    return (
      <PageContainer title="ID Card">
        <EmptyState title="No ID card found for this student" />
      </PageContainer>
    );
  }

  return (
    <PageContainer title="ID Card">
      <div className="print:hidden mb-4 flex justify-center gap-2">
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="size-4" />
          Print
        </Button>
        {canReissue && (
          <Button variant="outline" onClick={() => setReissueOpen(true)}>
            <RotateCcw className="size-4" />
            Reissue
          </Button>
        )}
      </div>

      <IdCardView card={card} schoolName={schoolName} schoolLogoUrl={schoolLogoUrl} />

      {canReissue && (
        <ReissueCardDialog open={reissueOpen} onOpenChange={setReissueOpen} studentId={studentId} />
      )}
    </PageContainer>
  );
}
