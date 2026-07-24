export type StudentStatus = 'active' | 'inactive' | 'transferred' | 'alumni';
export type Gender = 'male' | 'female' | 'other';

export interface ClassTeacherSummary {
  id: number;
  name: string;
  email: string;
}

export interface SchoolClass {
  id: number;
  uuid: string;
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
  // Live count (Prompt 17) — computed server-side via withCount on every
  // list/create/update response, never cached/stale.
  active_students_count?: number;
}

export interface StudentEnrollmentSummary {
  id: number;
  roll_no: string | null;
}

export interface ParentGuardianSummary {
  id: number;
  uuid: string;
  name: string;
  phone: string;
}

export interface StudentParentLinkSummary {
  id: number;
  parent_guardian?: ParentGuardianSummary | null;
}

export interface Student {
  id: number;
  uuid: string;
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
  // Sole human-facing identifier (Prompt 16) — undefined when the
  // id_card relation wasn't eager-loaded by the endpoint that returned
  // this student, not when the student genuinely has no card.
  barcode_value?: string;
  school_class?: SchoolClass;
  current_enrollment?: StudentEnrollmentSummary | null;
  primary_parent_link?: StudentParentLinkSummary | null;
}
