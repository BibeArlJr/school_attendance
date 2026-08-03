import type {
  AttendanceAnomalyEvent,
  AttendanceCalendarDay,
  AttendanceRecord,
  ScanResult,
  StudentAttendanceSummary,
} from '../types';
import type { SchoolCalendarEntry } from '@/features/settings/types';
import { apiClient } from '@/shared/lib/apiClient';
import type { ApiSuccessResponse, PaginatedResponse } from '@/shared/types';

export interface AttendanceRecordListParams {
  date?: string;
  status?: string;
  // Orthogonal to status — current physical presence (has scanned in but
  // not out today, vs scanned both) rather than the present/late/absent/
  // half_day/out_without_in daily classification. A row can be `late`
  // AND `in` at the same time, so this is a separate param, not one more
  // value merged into `status`.
  presence?: 'in' | 'out';
  class_id?: number;
  search?: string;
  page?: number;
  per_page?: number;
  owner_type?: 'student' | 'staff';
}

export interface AnomalyListParams {
  page?: number;
  per_page?: number;
}

export const attendanceApi = {
  async scan(barcodeValue: string, gateDeviceId?: number): Promise<ScanResult> {
    const { data } = await apiClient.post<ApiSuccessResponse<ScanResult>>('/gate-scanner/scan', {
      barcode_value: barcodeValue,
      gate_device_id: gateDeviceId,
    });
    return data.data;
  },

  async list(params: AttendanceRecordListParams): Promise<PaginatedResponse<AttendanceRecord>> {
    const { data } = await apiClient.get<ApiSuccessResponse<PaginatedResponse<AttendanceRecord>>>(
      '/attendance',
      { params },
    );
    return data.data;
  },

  async anomalies(params: AnomalyListParams): Promise<PaginatedResponse<AttendanceAnomalyEvent>> {
    const { data } = await apiClient.get<ApiSuccessResponse<PaginatedResponse<AttendanceAnomalyEvent>>>(
      '/attendance/anomalies',
      { params },
    );
    return data.data;
  },

  async reviewEvent(eventId: number, reviewNote?: string): Promise<AttendanceAnomalyEvent> {
    const { data } = await apiClient.patch<ApiSuccessResponse<AttendanceAnomalyEvent>>(
      `/attendance-events/${eventId}/review`,
      { review_note: reviewNote },
    );
    return data.data;
  },

  async updateRecord(
    recordId: number,
    values: {
      override_reason: string;
      in_time?: string;
      out_time?: string;
      status?: string;
      late?: boolean;
      early_departure?: boolean;
    },
  ): Promise<AttendanceRecord> {
    const { data } = await apiClient.patch<ApiSuccessResponse<AttendanceRecord>>(
      `/attendance-records/${recordId}`,
      values,
    );
    return data.data;
  },

  /** `from`/`to` are plain Gregorian date strings (YYYY-MM-DD) — the
   *  caller (AttendanceHistorySection) computes the exact AD span a BS
   *  month covers via the shared toAd/daysInBsMonth utilities and asks
   *  for exactly that (Prompt 28 Part B), since a BS month's days never
   *  line up with an AD calendar month's. */
  async studentCalendar(
    studentUuid: string,
    from: string,
    to: string,
  ): Promise<AttendanceCalendarDay[]> {
    const { data } = await apiClient.get<ApiSuccessResponse<AttendanceCalendarDay[]>>(
      `/students/${studentUuid}/attendance-calendar`,
      { params: { from, to } },
    );
    return data.data;
  },

  async studentSummary(studentUuid: string): Promise<StudentAttendanceSummary> {
    const { data } = await apiClient.get<ApiSuccessResponse<StudentAttendanceSummary>>(
      `/students/${studentUuid}/attendance-summary`,
    );
    return data.data;
  },

  /**
   * Read-only school_calendars, reachable by guard (Prompt 25 Part D) —
   * a narrow endpoint under access-gate-scanner, deliberately separate
   * from Settings' full calendar CRUD, which guard has no access to.
   */
  async gateCalendar(): Promise<SchoolCalendarEntry[]> {
    const { data } = await apiClient.get<ApiSuccessResponse<SchoolCalendarEntry[]>>(
      '/gate-scanner/calendar',
    );
    return data.data;
  },
};
