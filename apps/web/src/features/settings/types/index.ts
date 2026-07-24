export interface SchoolProfile {
  id: number;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
  // Immutable via /settings/school — embedded in every already-issued
  // barcode (SCH001-STD-...). Always shown, never editable.
  school_code: string | null;
}

export interface AttendanceConfig {
  school_id: number;
  start_time: string;
  end_time: string;
  late_threshold_minutes: number;
  early_departure_threshold_minutes: number;
  duplicate_scan_window_seconds: number;
  working_days: number[];
}

export type CalendarDayType = 'working' | 'holiday' | 'half_day' | 'exam_day';

export interface SchoolCalendarEntry {
  id: number;
  date: string;
  day_type: CalendarDayType;
  label: string | null;
  half_day_end_time: string | null;
}

export interface AcademicYear {
  id: number;
  label: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

export type LicenseStatusValue = 'active' | 'grace' | 'expired';

export interface License {
  status: LicenseStatusValue;
  amc_expiry_date: string | null;
  days_until_expiry: number | null;
  grace_days: number;
}
