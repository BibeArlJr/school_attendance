export type SmsLogStatus = 'sent' | 'failed';

export interface SmsLog {
  id: number;
  recipient_phone: string;
  message: string;
  status: SmsLogStatus;
  provider_response_code: number | null;
  provider_response_message: string | null;
  related_attendance_record_id: number | null;
  sent_at: string;
}

export interface SmsCredits {
  credits_available: number;
  credits_consumed: number;
  driver: 'mock' | 'real';
}
