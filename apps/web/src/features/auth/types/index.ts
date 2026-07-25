export type UserRole = 'super_admin' | 'admin' | 'teacher' | 'parent' | 'guard';

export interface SchoolSummary {
  id: number;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  school_id: number | null;
  school?: SchoolSummary | null;
  // Only meaningful for role='super_admin' — which school's data they're
  // currently viewing (Prompt 24). Null until they select one via the
  // Platform Console / Topbar switcher.
  active_school?: SchoolSummary | null;
}

// LoginCredentials intentionally isn't declared here — it's inferred from
// `loginSchema` in ../schema.ts (z.infer<typeof loginSchema>, re-exported as
// LoginFormValues) so the Zod schema stays the single source of truth for
// the shape of the login form, per docs/architecture/forms-pattern.md.

export interface LoginResult {
  user: AuthUser;
  token: string;
  refresh_token: string;
  expires_at: string;
}

// Returned by POST /auth/refresh — same access+refresh pair shape as login,
// minus `user` (the frontend already has it, no need to re-fetch it).
export interface RefreshResult {
  token: string;
  refresh_token: string;
  expires_at: string;
}
