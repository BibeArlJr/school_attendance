export type StaffImportBatchStatus = 'processing' | 'ready_for_review' | 'committed';
export type StaffImportRowResolution = 'pending' | 'accept' | 'skip';
// No 'unrecognized_class' here — staff has no class-matching subsystem
// at all (Part H). 'no_citizenship_number' is new: flags every row
// that fell back to the name+mobile duplicate key instead of the real
// unique identifier, purely informational (never blocks accept).
export type StaffImportRowFlag = 'possible_duplicate' | 'no_citizenship_number';

export interface StaffImportDuplicateMatch {
  type: 'existing_staff' | 'batch_row';
  staff_id?: number;
  sheet_name?: string;
  row_number?: number;
}

export interface StaffImportProposedData {
  name: string;
  mobile: string | null;
  dob_bs: string | null;
  citizenship_number: string | null;
  designation: string | null;
  rank: string | null;
  sheet_roll_no: string | null;
  address: string | null;
  level: string | null;
  duplicate_matches: StaffImportDuplicateMatch[];
}

export interface StaffImportBatchRow {
  id: number;
  row_number: number;
  sheet_name: string;
  raw_data: Record<string, string | number | null>;
  proposed_data: StaffImportProposedData;
  flags: StaffImportRowFlag[];
  resolution: StaffImportRowResolution;
}

export interface StaffImportSkippedSheet {
  sheet_name: string;
  reason: string;
}

export interface StaffImportBatch {
  id: number;
  file_name: string;
  uploaded_at: string;
  total_rows: number;
  imported_count: number;
  skipped_count: number;
  skipped_sheets: StaffImportSkippedSheet[];
  status: StaffImportBatchStatus;
  rows: StaffImportBatchRow[];
}

export interface StaffImportRowDecision {
  id: number;
  resolution: 'accept' | 'skip';
  name?: string;
}

export interface StaffImportCommitResult {
  created: number;
  skipped: number;
  errors: { row_id: number; row_number: number; sheet_name: string; message: string }[];
}
