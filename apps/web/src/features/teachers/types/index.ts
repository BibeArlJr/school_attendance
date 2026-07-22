export type EmploymentStatus = 'active' | 'on_leave' | 'resigned';

export interface Teacher {
  id: number;
  user_id: number;
  name: string;
  email: string;
  is_active: boolean;
  designation: string;
  qualification: string | null;
  joined_date: string;
  employment_status: EmploymentStatus;
}
