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
  designation: string;
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
  id: number;
  date: string;
  in_time: string | null;
  out_time: string | null;
  status: AttendanceRecordStatus;
  day_type: 'working' | 'non_school_day';
  late: boolean;
  early_departure: boolean;
  source: 'scan' | 'manual';
  override_reason: string | null;
  owner_type: AttendanceOwnerType;
  student: AttendanceStudentSummary | null;
  staff: AttendanceStaffSummary | null;
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
