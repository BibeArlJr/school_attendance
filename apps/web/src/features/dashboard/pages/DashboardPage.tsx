import { useQuery } from '@tanstack/react-query';
import { GraduationCap, Users, ClipboardCheck, MessageSquareText } from 'lucide-react';
import { useEffect } from 'react';
import { dashboardApi } from '../api/dashboardApi';
import { SummaryCard } from '../components/SummaryCard';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { LoadingSkeleton } from '@/shared/components/feedback/LoadingSkeleton';
import { PageContainer } from '@/shared/components/layout/PageContainer';
import { Card, CardContent } from '@/shared/components/ui/card';
import { getNotificationService } from '@/shared/services/mock';

export default function DashboardPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: dashboardApi.getSummary,
  });

  useEffect(() => {
    // example usage — see docs/architecture/service-pattern.md
    void getNotificationService().notify('Welcome back to School ERP.');
  }, []);

  if (isError) {
    return (
      <PageContainer title="Dashboard">
        <ErrorState onRetry={() => refetch()} />
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Dashboard" description="Overview of your school, updated in real time.">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading || !data ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <LoadingSkeleton lines={2} />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <SummaryCard label="Total Students" value={data.total_students} icon={GraduationCap} />
            <SummaryCard label="Total Teachers" value={data.total_teachers} icon={Users} />
            <SummaryCard label="Present Today" value={data.present_today} icon={ClipboardCheck} />
            <SummaryCard
              label="SMS Sent Today"
              value={data.sms_sent_today}
              icon={MessageSquareText}
            />
          </>
        )}
      </div>
    </PageContainer>
  );
}
