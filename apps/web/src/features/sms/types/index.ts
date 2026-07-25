export type SmsLogStatus = 'sent' | 'failed';

export interface SmsLogStudent {
  id: number;
  uuid: string;
  first_name: string;
  last_name: string;
}

export interface SmsLog {
  id: number;
  recipient_phone: string;
  message: string;
  status: SmsLogStatus;
  provider_response_code: number | null;
  provider_response_message: string | null;
  related_attendance_record_id: number | null;
  sent_at: string;
  // null whenever the related attendance record is missing/deleted, or
  // (historically only — Prompt 34 removed staff scanning) its owner
  // wasn't a student (Prompt 36 Part A).
  student: SmsLogStudent | null;
}

export interface SmsCredits {
  credits_available: number;
  credits_consumed: number;
  driver: 'mock' | 'real';
}
