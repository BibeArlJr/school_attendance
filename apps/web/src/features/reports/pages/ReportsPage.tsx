import { useState } from 'react';
import { AttendanceSummaryTab } from '../components/AttendanceSummaryTab';
import { EnrollmentSummaryTab } from '../components/EnrollmentSummaryTab';
import { PageContainer } from '@/shared/components/layout/PageContainer';
import { Button } from '@/shared/components/ui/button';

type Tab = 'attendance' | 'enrollment';

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>('attendance');

  return (
    <PageContainer title="Reports" description="Attendance and enrollment analytics.">
      <div className="mb-4 flex gap-2 print:hidden">
        <Button variant={tab === 'attendance' ? 'default' : 'outline'} size="sm" onClick={() => setTab('attendance')}>
          Attendance Summary
        </Button>
        <Button variant={tab === 'enrollment' ? 'default' : 'outline'} size="sm" onClick={() => setTab('enrollment')}>
          Enrollment Summary
        </Button>
      </div>

      {tab === 'attendance' ? <AttendanceSummaryTab /> : <EnrollmentSummaryTab />}
    </PageContainer>
  );
}
