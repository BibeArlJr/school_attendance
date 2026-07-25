import { useEffect, type ReactNode } from 'react';
import { useAuthStore } from '@/features/auth/store/authStore';
import { foregroundOklchFor, hexToOklchTriple } from '@/shared/lib/color';

/**
 * Applies a school's chosen primary_color as the --primary/
 * --primary-foreground CSS variables, scoped to whichever school is
 * currently in view. Deliberately keyed off `branding` (derived in
 * authStore from the authenticated user's own school, or — for
 * super_admin — whichever school the topbar switcher currently points
 * at) rather than a global config, so switching schools or logging out
 * to a different school's login never leaks one school's color into
 * another's view. A school with no primary_color set (or nothing in
 * `branding` yet) falls back to the default token already in
 * globals.css by simply not overriding it.
 */
export function SchoolThemeProvider({ children }: { children: ReactNode }) {
  const primaryColor = useAuthStore((state) => state.branding?.primary_color ?? null);

  useEffect(() => {
    const root = document.documentElement;
    const triple = primaryColor ? hexToOklchTriple(primaryColor) : null;

    if (triple) {
      root.style.setProperty('--primary', triple);
      root.style.setProperty('--primary-foreground', foregroundOklchFor(primaryColor as string));
    } else {
      root.style.removeProperty('--primary');
      root.style.removeProperty('--primary-foreground');
    }

    return () => {
      root.style.removeProperty('--primary');
      root.style.removeProperty('--primary-foreground');
    };
  }, [primaryColor]);

  return children;
}
