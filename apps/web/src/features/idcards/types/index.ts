export type IdCardStatus = 'active' | 'lost' | 'deactivated';

export interface IdCardStudentSummary {
  id: number;
  first_name: string;
  last_name: string;
  admission_no: string;
  school_class: { id: number; name: string; section: string | null } | null;
}

export interface IdCard {
  id: number;
  barcode_value: string;
  status: IdCardStatus;
  issued_date: string;
  deactivated_date: string | null;
  student: IdCardStudentSummary;
}
