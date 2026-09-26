// Generic Bulk SMS contact-management + message-composer foundation
// (platform-level, super_admin/platform-admin only). Genuinely
// independent of every other contact concept in this app — no
// student/guardian/staff/school/chairman data is ever read here.

export interface BulkSmsContact {
  id: number;
  uuid: string;
  name: string | null;
  // Always the normalized, canonical 10-digit form — phone_raw is never
  // persisted, only ever present transiently in an upload preview
  // response (see BulkSmsUploadPreviewRow) before a row is confirmed.
  phone: string;
  created_at: string;
}

export type BulkSmsUploadRowStatus = 'valid' | 'invalid' | 'duplicate';

export interface BulkSmsUploadPreviewRow {
  row_number: number;
  sheet_name: string;
  name: string | null;
  phone_raw: string;
  phone_normalized: string | null;
  status: BulkSmsUploadRowStatus;
  reason: string | null;
}

export interface BulkSmsUploadSkippedSheet {
  sheet_name: string;
  reason: string;
}

export interface BulkSmsUploadPreviewResult {
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  duplicate_rows: number;
  skipped_sheets: BulkSmsUploadSkippedSheet[];
  rows: BulkSmsUploadPreviewRow[];
}

export interface BulkSmsUpload {
  id: number;
  file_name: string;
  uploaded_at: string;
  total_rows: number;
  imported_count: number;
  skipped_count: number;
}

export interface BulkSmsUploadConfirmResult {
  upload: BulkSmsUpload;
  created: number;
  skipped: number;
}

export interface BulkSmsUploadConfirmRow {
  name: string | null;
  // The raw, as-typed/as-uploaded value — the server re-normalizes and
  // re-checks duplicates from scratch on confirm, never trusting
  // anything computed client-side during preview.
  phone: string;
}

// Stage 2 — the module's own, separate Sparrow credential + single-
// recipient test-send. Never App\Modules\Sms's attendance credential/
// SmsLog on the backend, and nothing here ever selects a saved contact
// or an upload — see BulkSmsTestSendSection's own docblock.

export interface BulkSmsProviderConfigInfo {
  configured: boolean;
  is_active: boolean;
  sender_id: string | null;
  // Never the full token — last-4-chars form only (e.g. "••••2345").
  masked_token: string | null;
  updated_at: string | null;
}

export interface BulkSmsCredits {
  configured: boolean;
  credits_available: number;
  credits_consumed: number;
  // true when BULK_SMS_DRIVER isn't 'real' — this is a simulated
  // balance, not Sparrow's real one.
  mock: boolean;
  error: string | null;
  driver: 'mock' | 'real';
}

export type BulkSmsSendLogStatus = 'sent' | 'failed' | 'mock';

export interface BulkSmsSendLog {
  id: number;
  recipient: string;
  message: string;
  segment_count: number;
  status: BulkSmsSendLogStatus;
  provider_response_code: number | null;
  provider_response_message: string | null;
  attempted_at: string | null;
  sent_at: string | null;
}
