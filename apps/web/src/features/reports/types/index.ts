export type CalendarDayType = 'working' | 'holiday' | 'half_day' | 'exam_day';

export interface AttendanceSummaryRow {
  date: string;
  present: number;
  absent: number;
  late: number;
  total: number;
  // Calendar override alone — a plain Saturday still reports "working"
  // here (it has no calendar override). is_working_day is the real
  // combined signal to use for "was this actually a school day".
  day_type: CalendarDayType;
  is_working_day: boolean;
}

export interface EnrollmentClassSummary {
  id: number;
  uuid: string;
  name: string;
  section: string | null;
  active_students_count: number;
}

export interface StatusBreakdown {
  active: number;
  inactive: number;
  transferred: number;
  alumni: number;
}

export interface DataQualityMetric {
  count: number;
  percentage: number;
}

export interface EnrollmentSummary {
  classes: EnrollmentClassSummary[];
  status_breakdown: StatusBreakdown;
  data_quality: {
    total_students: number;
    missing_gender: DataQualityMetric;
    missing_dob: DataQualityMetric;
    no_guardian: DataQualityMetric;
  };
}
