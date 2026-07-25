export type AttendanceEventResult =
  | 'matched_in'
  | 'matched_out'
  | 'duplicate_ignored'
  | 'unknown_barcode'
  | 'card_inactive'
  | 'owner_inactive';

export type AttendanceRecordStatus = 'present' | 'late' | 'absent' | 'half_day' | 'out_without_in';

export type AttendanceOwnerType = 'student' | 'staff';

export interface AttendanceStudentSummary {
  id: number;
  first_name: string;
  last_name: string;
  school_class: { id: number; name: string; section: string | null } | null;
}

export interface AttendanceStaffSummary {
  id: number;
  name: string;
  designation: string | null;
}

export interface ScanResult {
  result: AttendanceEventResult;
  needs_review: boolean;
  sms_sent: boolean;
  scanned_at: string;
  owner_type: AttendanceOwnerType | null;
  student: AttendanceStudentSummary | null;
  staff: AttendanceStaffSummary | null;
  record: {
    in_time: string | null;
    out_time: string | null;
    status: AttendanceRecordStatus;
    late: boolean;
    early_departure: boolean;
  } | null;
}

export interface AttendanceRecord {
  // For a synthesized "absent" row (Prompt 18, no stored record behind a
  // no-show) this is -ownerId, never a real attendance_record id — kept
  // numeric (rather than null) so this type still satisfies DataTable's
  // `{ id: number }` constraint; `source === null` is the real "is this
  // editable" signal (see attendanceColumns.tsx).
  id: number;
  date: string;
  in_time: string | null;
  out_time: string | null;
  status: AttendanceRecordStatus;
  day_type: 'working' | 'non_school_day';
  late: boolean;
  early_departure: boolean;
  source: 'scan' | 'manual' | null;
  override_reason: string | null;
  owner_type: AttendanceOwnerType;
  student: AttendanceStudentSummary | null;
  staff: AttendanceStaffSummary | null;
}

export type AttendanceCalendarDayStatus =
  | 'present'
  | 'late'
  | 'absent'
  | 'holiday'
  | 'non_school_day'
  | 'upcoming';

export interface AttendanceCalendarDay {
  date: string;
  status: AttendanceCalendarDayStatus;
  day_type: string;
  label: string | null;
  in_time: string | null;
  out_time: string | null;
}

export interface StudentAttendanceSummary {
  from: string;
  to: string;
  total_working_days: number;
  present_days: number;
  absent_days: number;
  attendance_percentage: number;
}

export interface AttendanceAnomalyEvent {
  id: number;
  barcode_value: string;
  result: AttendanceEventResult;
  scanned_at: string;
  needs_review: boolean;
  reviewed_by: number | null;
  reviewed_at: string | null;
  review_note: string | null;
  gate_device: { id: number; name: string } | null;
  guard: { id: number; name: string } | null;
  owner_type: AttendanceOwnerType | null;
  student: AttendanceStudentSummary | null;
  staff: AttendanceStaffSummary | null;
}
