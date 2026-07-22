import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { GraduationCap, Users, ClipboardCheck, MessageSquareText } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { dashboardApi } from '../api/dashboardApi';
import { AttendanceTrendChart } from '../components/AttendanceTrendChart';
import { SummaryCard } from '../components/SummaryCard';
import { useAttendanceTrend } from '../hooks/useAttendanceTrend';
import { GateActivityFeed } from '@/features/gate-feed/components/GateActivityFeed';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { LoadingSkeleton } from '@/shared/components/feedback/LoadingSkeleton';
import { PageContainer } from '@/shared/components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { getNotificationService } from '@/shared/services/mock';

const cardGridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const cardItemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.18, ease: 'easeOut' as const } },
};

export default function DashboardPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: dashboardApi.getSummary,
  });
  const attendanceTrend = useAttendanceTrend();

  useEffect(() => {
    // example usage — see docs/architecture/service-pattern.md
    void getNotificationService().notify('Welcome back to School ERP.');
  }, []);

  // Additive only — the summary query above is untouched (same queryKey,
  // queryFn, endpoint). This just adds a supplementary toast signal.
  useEffect(() => {
    if (isError) {
      toast.error('Could not load the dashboard summary.');
    }
  }, [isError]);

  if (isError) {
    return (
      <PageContainer title="Dashboard">
        <ErrorState onRetry={() => refetch()} />
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Dashboard" description="Overview of your school, updated in real time.">
      <motion.div
        variants={cardGridVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
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
            <motion.div variants={cardItemVariants}>
              <SummaryCard
                label="Total Students"
                value={data.total_students}
                icon={GraduationCap}
              />
            </motion.div>
            <motion.div variants={cardItemVariants}>
              <SummaryCard label="Total Teachers" value={data.total_teachers} icon={Users} />
            </motion.div>
            <motion.div variants={cardItemVariants}>
              <SummaryCard label="Present Today" value={data.present_today} icon={ClipboardCheck} />
            </motion.div>
            <motion.div variants={cardItemVariants}>
              <SummaryCard
                label="SMS Sent Today"
                value={data.sms_sent_today}
                icon={MessageSquareText}
              />
            </motion.div>
          </>
        )}
      </motion.div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Weekly Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {attendanceTrend.isLoading ? (
              <div className="flex h-[220px] flex-col justify-end gap-2 py-4">
                <LoadingSkeleton lines={4} />
              </div>
            ) : attendanceTrend.isError ? (
              <ErrorState onRetry={() => attendanceTrend.refetch()} />
            ) : attendanceTrend.data && attendanceTrend.data.length > 0 ? (
              <AttendanceTrendChart data={attendanceTrend.data} />
            ) : (
              <EmptyState title="No attendance data yet" />
            )}
          </CardContent>
        </Card>

        <GateActivityFeed />
      </div>
    </PageContainer>
  );
}
