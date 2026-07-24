export type LicenseStatusValue = 'active' | 'grace' | 'expired';

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
  amc_expiry_date: string | null;
  // The real, live-computed status — never the raw license_status column
  // (a record of the last activation action, not the source of truth).
  computed_license_status: LicenseStatusValue;
  days_until_expiry: number | null;
}

export interface CreateSchoolResult {
  school: PlatformSchool;
  admin_email: string;
  temporary_password: string;
}
