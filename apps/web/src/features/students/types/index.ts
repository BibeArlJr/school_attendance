export type StudentStatus = 'active' | 'inactive' | 'transferred' | 'alumni';
export type Gender = 'male' | 'female' | 'other';

export interface ClassTeacherSummary {
  id: number;
  name: string;
  email: string;
}

export interface SchoolClass {
  id: number;
  school_id: number;
  academic_year_id: number;
  name: string;
  section: string | null;
  // Display/sort order only — inferred server-side, never shown as the
  // class's name. Classes are already returned sorted by this (nulls
  // last, falling back to name/section) — no need to re-sort client-side.
  grade_level: number | null;
  class_teacher_id: number | null;
  class_teacher?: ClassTeacherSummary | null;
}

export interface StudentEnrollmentSummary {
  id: number;
  roll_no: string | null;
}

export interface ParentGuardianSummary {
  id: number;
  name: string;
  phone: string;
}

export interface StudentParentLinkSummary {
  id: number;
  parent_guardian?: ParentGuardianSummary | null;
}

export interface Student {
  id: number;
  school_id: number;
  class_id: number;
  first_name: string;
  last_name: string;
  // null for bulk-imported students, whose only known DOB is `dob_bs`
  // (Bikram Sambat) — see formatDob in lib/formatDob.ts for the fallback.
  dob: string | null;
  gender: Gender | null;
  status: StudentStatus;
  admission_date: string;
  address: string | null;
  dob_bs: string | null;
  school_class?: SchoolClass;
  current_enrollment?: StudentEnrollmentSummary | null;
  primary_parent_link?: StudentParentLinkSummary | null;
}
