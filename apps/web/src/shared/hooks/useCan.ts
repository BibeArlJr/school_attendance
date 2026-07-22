import { useAuthStore } from '@/features/auth/store/authStore';
import type { UserRole } from '@/features/auth/types';

/**
 * Lightweight role check for conditionally hiding/disabling UI (buttons,
 * menu items) — not route-level guarding, which RoleGuard already handles.
 * Controls gated by this must not render at all for disallowed roles, not
 * just be disabled/hidden via CSS.
 */
export function useCan(allowedRoles: UserRole[]): boolean {
  const role = useAuthStore((state) => state.user?.role);
  return role !== undefined && allowedRoles.includes(role);
}
