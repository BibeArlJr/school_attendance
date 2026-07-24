import type {
  AttendanceAnomalyEvent,
  AttendanceCalendarDay,
  AttendanceRecord,
  ScanResult,
  StudentAttendanceSummary,
} from '../types';
import { apiClient } from '@/shared/lib/apiClient';
import type { ApiSuccessResponse, PaginatedResponse } from '@/shared/types';

export interface AttendanceRecordListParams {
  date?: string;
  status?: string;
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

  async studentCalendar(
    studentUuid: string,
    year: number,
    month: number,
  ): Promise<AttendanceCalendarDay[]> {
    const { data } = await apiClient.get<ApiSuccessResponse<AttendanceCalendarDay[]>>(
      `/students/${studentUuid}/attendance-calendar`,
      { params: { year, month } },
    );
    return data.data;
  },

  async studentSummary(studentUuid: string): Promise<StudentAttendanceSummary> {
    const { data } = await apiClient.get<ApiSuccessResponse<StudentAttendanceSummary>>(
      `/students/${studentUuid}/attendance-summary`,
    );
    return data.data;
  },
};
