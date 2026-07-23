export type ImportBatchStatus = 'processing' | 'ready_for_review' | 'committed';
export type ImportRowResolution = 'pending' | 'accept' | 'skip';
export type ImportRowFlag = 'unrecognized_class' | 'possible_duplicate';

export interface ImportDuplicateMatch {
  type: 'existing_student' | 'batch_row';
  student_id?: number;
  sheet_name?: string;
  row_number?: number;
}

export interface ImportProposedData {
  roll_no: string | null;
  first_name: string;
  last_name: string;
  class_name_raw: string;
  class_id: number | null;
  suggested_class_id: number | null;
  suggested_class_name: string | null;
  dob_bs: string | null;
  address: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  duplicate_matches: ImportDuplicateMatch[];
}

export interface ImportBatchRow {
  id: number;
  row_number: number;
  sheet_name: string;
  raw_data: Record<string, string | number | null>;
  proposed_data: ImportProposedData;
  flags: ImportRowFlag[];
  resolution: ImportRowResolution;
}

export interface ImportSkippedSheet {
  sheet_name: string;
  reason: string;
}

export interface ImportBatch {
  id: number;
  file_name: string;
  uploaded_at: string;
  total_rows: number;
  imported_count: number;
  skipped_count: number;
  skipped_sheets: ImportSkippedSheet[];
  status: ImportBatchStatus;
  rows: ImportBatchRow[];
}

export interface ImportRowDecision {
  id: number;
  resolution: 'accept' | 'skip';
  class_id?: number;
  new_class_name?: string;
  new_class_section?: string;
  first_name?: string;
  last_name?: string;
}

export interface ImportCommitResult {
  created: number;
  skipped: number;
  errors: { row_id: number; row_number: number; sheet_name: string; message: string }[];
}
