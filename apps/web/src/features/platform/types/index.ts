export interface PlatformSchool {
  id: number;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
  school_code: string;
  contact_email: string | null;
  contact_phone: string | null;
  staff_count: number;
  students_count: number;
  created_at: string;
}

export interface CreateSchoolResult {
  school: PlatformSchool;
  admin_email: string;
  temporary_password: string;
}
