import { NavLink, Outlet } from 'react-router-dom';
import { ROUTES } from '@/app/router/routes';
import { PageContainer } from '@/shared/components/layout/PageContainer';
import { cn } from '@/shared/lib/utils';

const TABS = [
  { to: ROUTES.STUDENTS, label: 'Students', end: true },
  { to: ROUTES.STUDENTS_CLASSES, label: 'Classes', end: false },
];

export default function StudentsLayout() {
  return (
    <PageContainer title="Students" description="Manage student records and class assignments.">
      <div className="flex gap-1 border-b">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              cn(
                'border-b-2 border-transparent px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
                isActive && 'border-primary text-foreground',
              )
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>
      <Outlet />
    </PageContainer>
  );
}
