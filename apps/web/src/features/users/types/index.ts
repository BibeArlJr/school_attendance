export type EmploymentStatus = 'active' | 'on_leave' | 'resigned';
// 'teacher' stays in this union even though it's no longer a creatable
// role — existing (now-resigned) teacher accounts still carry that
// value and must keep rendering correctly in this list/detail view;
// only the create-form's role selector (schema.ts) excludes it.
export type UserRole = 'teacher' | 'guard' | 'admin';

// Renamed from Staff (Staff -> Users rename) — this is a login-account
// profile (name/email/role/designation on top of a real User row), not
// the unrelated HR-domain Staff concept (features/staff).
export interface UserAccount {
  id: number;
  uuid: string;
  user_id: number;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  designation: string | null;
  employment_status: EmploymentStatus;
}
