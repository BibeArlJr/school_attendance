export type IdCardStatus = 'active' | 'lost' | 'deactivated';
export type IdCardOwnerType = 'student' | 'staff';

export interface IdCardStudentSummary {
  id: number;
  uuid: string;
  first_name: string;
  last_name: string;
  roll_no: string | null;
  school_class: { id: number; name: string; section: string | null } | null;
}

export interface IdCardStaffSummary {
  id: number;
  uuid: string;
  name: string;
  designation: string;
}

export interface IdCard {
  id: number;
  barcode_value: string;
  status: IdCardStatus;
  issued_date: string;
  deactivated_date: string | null;
  owner_type: IdCardOwnerType;
  student: IdCardStudentSummary | null;
  staff: IdCardStaffSummary | null;
}
