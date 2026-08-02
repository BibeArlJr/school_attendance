export interface DashboardSummary {
  total_students: number;
  total_staff: number;
  present_today: number;
  absent_today: number;
  late_today: number;
  is_working_day: boolean;
  sms_sent_today: number;
}
