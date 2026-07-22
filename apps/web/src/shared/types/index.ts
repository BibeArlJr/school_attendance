export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors: Record<string, string[]> | null;
}

export interface AttendanceTrendPoint {
  date: string; // YYYY-MM-DD
  presentCount: number;
  totalCount: number;
}

export interface GateEvent {
  id: string;
  studentName: string;
  className: string;
  timestamp: string; // ISO 8601
  type: 'entry' | 'exit';
  smsStatus: 'sent' | 'pending' | 'failed';
}
