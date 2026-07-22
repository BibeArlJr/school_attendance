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

/** Shape of a Laravel paginator response, wrapped as ApiSuccessResponse<T>'s data. */
export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}
