import { useEffect, type ReactNode } from 'react';
import { useAuthStore } from '@/features/auth/store/authStore';
import { foregroundOklchFor, hexToOklchTriple } from '@/shared/lib/color';

/**
 * Applies a school's chosen primary_color as the app's one existing
 * accent token — --primary/--primary-foreground, plus --ring/
 * --sidebar-ring (focus rings already point at these separately from
 * --primary in globals.css, so they need the same override to actually
 * read as "the accent color" rather than a fixed neutral gray) — scoped
 * to whichever school is currently in view. This is deliberately not a
 * new theme system: no other token is touched, spacing/typography are
 * untouched, and Sidebar's active-nav-item style was changed to key off
 * --primary too (bg-primary/10 text-primary) instead of the neutral
 * --sidebar-accent it used before, so "active nav state" genuinely
 * reflects the school's color rather than a fixed gray highlight.
 *
 * Keyed off `branding` (derived in authStore from the authenticated
 * user's own school, or — for super_admin — whichever school the topbar
 * switcher currently points at) rather than a global config, so
 * switching schools or logging out to a different school's login never
 * leaks one school's color into another's view. A school with no
 * primary_color set (or nothing in `branding` yet) falls back to the
 * default tokens already in globals.css by simply not overriding them.
 */
export function SchoolThemeProvider({ children }: { children: ReactNode }) {
  const primaryColor = useAuthStore((state) => state.branding?.primary_color ?? null);

  useEffect(() => {
    const root = document.documentElement;
    const triple = primaryColor ? hexToOklchTriple(primaryColor) : null;

    if (triple) {
      root.style.setProperty('--primary', triple);
      root.style.setProperty('--primary-foreground', foregroundOklchFor(primaryColor as string));
      root.style.setProperty('--ring', triple);
      root.style.setProperty('--sidebar-ring', triple);
    } else {
      root.style.removeProperty('--primary');
      root.style.removeProperty('--primary-foreground');
      root.style.removeProperty('--ring');
      root.style.removeProperty('--sidebar-ring');
    }

    return () => {
      root.style.removeProperty('--primary');
      root.style.removeProperty('--primary-foreground');
      root.style.removeProperty('--ring');
      root.style.removeProperty('--sidebar-ring');
    };
  }, [primaryColor]);

  return children;
}
