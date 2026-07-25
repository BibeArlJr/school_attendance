export type EmploymentStatus = 'active' | 'on_leave' | 'resigned';
// Prompt 26: this list/type now covers all three — "Teacher"/teachersApi/
// etc are kept as the underlying names (existing functionality, URLs, and
// permissions stay completely unaffected), the visible UI just presents
// it as a unified Staff list with a role column/filter. admin added by
// the Part A addendum — a school previously had no way to add a second
// admin account beyond the one auto-created at school-creation time.
export type StaffRole = 'teacher' | 'guard' | 'admin';

export interface Teacher {
  id: number;
  uuid: string;
  user_id: number;
  name: string;
  email: string;
  role: StaffRole;
  is_active: boolean;
  designation: string;
  qualification: string | null;
  joined_date: string;
  employment_status: EmploymentStatus;
}
