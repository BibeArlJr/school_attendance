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
