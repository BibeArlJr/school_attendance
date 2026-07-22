import type { ReactNode } from 'react';
import { useAuthStore } from '@/features/auth/store/authStore';
import type { UserRole } from '@/features/auth/types';
import { ForbiddenState } from '@/shared/components/feedback/ForbiddenState';
import { PageContainer } from '@/shared/components/layout/PageContainer';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  pageTitle: string;
  children: ReactNode;
}

/**
 * Sibling to ProtectedRoute, not a replacement: ProtectedRoute is the
 * coarse, all-or-nothing "are you logged in" check for the whole
 * authenticated route subtree; RoleGuard is the per-route "can THIS role
 * see THIS module" check, since allowed roles vary module by module (see
 * shared/constants/modules.ts, the single source of truth for the matrix).
 */
export function RoleGuard({ allowedRoles, pageTitle, children }: RoleGuardProps) {
  const role = useAuthStore((state) => state.user?.role);

  if (!role || !allowedRoles.includes(role)) {
    return (
      <PageContainer title={pageTitle}>
        <ForbiddenState />
      </PageContainer>
    );
  }

  return children;
}
