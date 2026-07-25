export type EmploymentStatus = 'active' | 'on_leave' | 'resigned';
// 'teacher' stays in this union even though it's no longer a creatable
// role (Prompt 34 Part A) — existing (now-resigned) teacher accounts
// still carry that value and must keep rendering correctly in this
// list/detail view; only the create-form's role selector (schema.ts)
// excludes it.
export type StaffRole = 'teacher' | 'guard' | 'admin';

export interface Staff {
  id: number;
  uuid: string;
  user_id: number;
  name: string;
  email: string;
  role: StaffRole;
  is_active: boolean;
  designation: string | null;
  employment_status: EmploymentStatus;
}
