import { create } from 'zustand';
import type { AuthUser, SchoolSummary } from '../types';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
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
}

// Phase 13 hardening TODO: the token currently lives in localStorage, which
// is readable by any script on the page (XSS risk). Replace with an
// httpOnly cookie or a short-lived access token + refresh flow before
// production launch.
const TOKEN_KEY = 'school_erp.token';
const USER_KEY = 'school_erp.user';

function readPersistedUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

const persistedToken = localStorage.getItem(TOKEN_KEY);

export const useAuthStore = create<AuthState>((set) => ({
  user: persistedToken ? readPersistedUser() : null,
  token: persistedToken,
  isAuthenticated: Boolean(persistedToken),
  login: (user, token) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
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
      return { user };
    });
  },
}));
