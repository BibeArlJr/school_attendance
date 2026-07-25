import { create } from 'zustand';
import type { AuthUser, SchoolSummary } from '../types';

export interface SchoolBranding {
  logo_url: string | null;
  primary_color: string | null;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  /**
   * The last-known branding (logo/color) for whichever school this
   * browser was last operating as — deliberately NOT cleared on logout
   * (see BRANDING_KEY below), so the pre-auth Login screen can still
   * show that school's own logo/accent instead of a generic default.
   * Each browser only ever remembers its own last session, so this never
   * leaks one school's branding into a different school's login.
   */
  branding: SchoolBranding | null;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
  /**
   * Updates the persisted user's active_school after a successful
   * POST /platform/active-school — nothing else in the app currently
   * refetches /auth/me, so this is the one place that keeps the Topbar
   * and the AppShell's "no school selected" gate in sync with the
   * backend immediately after switching (Prompt 24).
   */
  setActiveSchool: (school: SchoolSummary) => void;
  /**
   * Keeps the Topbar/Login logo and the SchoolThemeProvider's accent
   * color in sync immediately after a Settings-page logo upload or
   * color change, without requiring a fresh login/me refetch — patches
   * whichever of user.school / user.active_school is the one currently
   * driving `branding` (see brandingFromUser below).
   */
  updateOwnSchoolBranding: (patch: Partial<SchoolBranding>) => void;
}

// Phase 13 hardening TODO: the token currently lives in localStorage, which
// is readable by any script on the page (XSS risk). Replace with an
// httpOnly cookie or a short-lived access token + refresh flow before
// production launch.
const TOKEN_KEY = 'school_erp.token';
const USER_KEY = 'school_erp.user';
const BRANDING_KEY = 'school_erp.branding';

function readPersistedUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function readPersistedBranding(): SchoolBranding | null {
  const raw = localStorage.getItem(BRANDING_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as SchoolBranding;
  } catch {
    return null;
  }
}

// super_admin has no school of their own — active_school (whichever
// school the topbar switcher currently points at) is the one that
// matters for them; every other role is scoped to their own `school`.
function brandingFromUser(user: AuthUser): SchoolBranding | null {
  const school = user.role === 'super_admin' ? user.active_school : user.school;
  if (!school) return null;

  return { logo_url: school.logo_url, primary_color: school.primary_color };
}

function persistBranding(branding: SchoolBranding | null) {
  if (branding) {
    localStorage.setItem(BRANDING_KEY, JSON.stringify(branding));
  }
}

const persistedToken = localStorage.getItem(TOKEN_KEY);

export const useAuthStore = create<AuthState>((set) => ({
  user: persistedToken ? readPersistedUser() : null,
  token: persistedToken,
  isAuthenticated: Boolean(persistedToken),
  branding: readPersistedBranding(),
  login: (user, token) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    const branding = brandingFromUser(user);
    persistBranding(branding);
    set((state) => ({ user, token, isAuthenticated: true, branding: branding ?? state.branding }));
  },
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    set({ user: null, token: null, isAuthenticated: false });
  },
  setActiveSchool: (school) => {
    set((state) => {
      if (!state.user) return state;
      const user = { ...state.user, active_school: school };
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      const branding = brandingFromUser(user);
      persistBranding(branding);
      return { user, branding: branding ?? state.branding };
    });
  },
  updateOwnSchoolBranding: (patch) => {
    set((state) => {
      if (!state.user) return state;
      const key = state.user.role === 'super_admin' ? 'active_school' : 'school';
      const currentSchool = state.user[key];
      if (!currentSchool) return state;

      const updatedSchool = { ...currentSchool, ...patch };
      const user = { ...state.user, [key]: updatedSchool };
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      const branding = { logo_url: updatedSchool.logo_url, primary_color: updatedSchool.primary_color };
      persistBranding(branding);
      return { user, branding };
    });
  },
}));
