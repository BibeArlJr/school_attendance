export type UserRole = 'super_admin' | 'admin' | 'teacher' | 'parent' | 'guard';

export interface SchoolSummary {
  id: number;
  name: string;
  slug: string;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  school_id: number | null;
  school?: SchoolSummary;
}

// LoginCredentials intentionally isn't declared here — it's inferred from
// `loginSchema` in ../schema.ts (z.infer<typeof loginSchema>, re-exported as
// LoginFormValues) so the Zod schema stays the single source of truth for
// the shape of the login form, per docs/architecture/forms-pattern.md.

export interface LoginResult {
  user: AuthUser;
  token: string;
}
