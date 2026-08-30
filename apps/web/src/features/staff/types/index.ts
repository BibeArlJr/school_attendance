// New HR-domain personnel record (Rebuild Staff Module Part C) —
// genuinely independent of features/users' UserAccount (login
// accounts). No user_id, no login capability implied.
export type StaffEmploymentStatus = 'active' | 'on_leave' | 'resigned';

export interface Staff {
  id: number;
  uuid: string;
  name: string;
  mobile: string | null;
  dob_bs: string | null;
  address: string | null;
  citizenship_number: string | null;
  designation: string | null;
  rank: string | null;
  sheet_roll_no: string | null;
  level: string | null;
  employment_status: StaffEmploymentStatus;
  created_at: string | null;
}
