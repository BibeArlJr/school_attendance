import { Construction } from 'lucide-react';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { PageContainer } from '@/shared/components/layout/PageContainer';

interface PlaceholderPageProps {
  title: string;
  phase: number;
}

export default function PlaceholderPage({ title, phase }: PlaceholderPageProps) {
  return (
    <PageContainer title={title}>
      <EmptyState
        icon={Construction}
        title={`${title} is coming in Phase ${phase}`}
        description="This module isn't built yet. It's wired into navigation now so the sidebar structure stays stable as later phases fill it in."
      />
    </PageContainer>
  );
}
