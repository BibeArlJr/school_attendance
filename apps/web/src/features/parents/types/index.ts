export type GuardianRelation = 'father' | 'mother' | 'guardian' | 'other';

export interface LinkedStudentSummary {
  link_id: number;
  relation: GuardianRelation;
  is_primary_contact: boolean;
  student: {
    id: number;
    first_name: string;
    last_name: string;
    school_class: { id: number; name: string; section: string | null } | null;
  };
}

export interface ParentGuardian {
  id: number;
  school_id: number;
  name: string;
  phone: string;
  email: string | null;
  user_id: number | null;
  linked_students_count?: number;
  linked_students?: LinkedStudentSummary[];
}

export interface StudentGuardianLink {
  link_id: number;
  relation: GuardianRelation;
  is_primary_contact: boolean;
  parent: {
    id: number;
    name: string;
    phone: string;
    email: string | null;
  };
}
