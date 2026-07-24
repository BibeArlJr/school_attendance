import { useState } from 'react';
import { AcademicYearLicenseSection } from '../components/AcademicYearLicenseSection';
import { AttendanceRulesSection } from '../components/AttendanceRulesSection';
import { SchoolCalendarSection } from '../components/SchoolCalendarSection';
import { SchoolProfileSection } from '../components/SchoolProfileSection';
import { PageContainer } from '@/shared/components/layout/PageContainer';
import { Button } from '@/shared/components/ui/button';

type Tab = 'profile' | 'attendance' | 'calendar' | 'academic-year';

const TABS: { key: Tab; label: string }[] = [
  { key: 'profile', label: 'School Profile' },
  { key: 'attendance', label: 'Attendance Rules' },
  { key: 'calendar', label: 'Calendar' },
  { key: 'academic-year', label: 'Academic Year & License' },
];

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('profile');

  return (
    <PageContainer title="Settings" description="School profile, attendance rules, and calendar.">
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Button
            key={t.key}
            variant={tab === t.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {tab === 'profile' && <SchoolProfileSection />}
      {tab === 'attendance' && <AttendanceRulesSection />}
      {tab === 'calendar' && <SchoolCalendarSection />}
      {tab === 'academic-year' && <AcademicYearLicenseSection />}
    </PageContainer>
  );
}
