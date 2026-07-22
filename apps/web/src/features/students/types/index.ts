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
  class_teacher_id: number | null;
  class_teacher?: ClassTeacherSummary | null;
}

export interface Student {
  id: number;
  school_id: number;
  class_id: number;
  admission_no: string;
  first_name: string;
  last_name: string;
  dob: string;
  gender: Gender;
  status: StudentStatus;
  admission_date: string;
  school_class?: SchoolClass;
}
