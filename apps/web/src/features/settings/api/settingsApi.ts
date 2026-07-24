import type {
  AcademicYear,
  AttendanceConfig,
  SchoolCalendarEntry,
  SchoolProfile,
} from '../types';
import { apiClient } from '@/shared/lib/apiClient';
import type { ApiSuccessResponse } from '@/shared/types';

export interface SchoolProfileInput {
  name: string;
  logo_url: string | null;
  primary_color: string | null;
}

export interface AttendanceConfigInput {
  start_time: string;
  end_time: string;
  late_threshold_minutes: number;
  early_departure_threshold_minutes: number;
  duplicate_scan_window_seconds: number;
  working_days: number[];
}

export interface CalendarEntryInput {
  date: string;
  day_type: string;
  label: string | null;
  half_day_end_time: string | null;
}

export const settingsApi = {
  async getSchool(): Promise<SchoolProfile> {
    const { data } = await apiClient.get<ApiSuccessResponse<SchoolProfile>>('/settings/school');
    return data.data;
  },

  async updateSchool(values: SchoolProfileInput): Promise<SchoolProfile> {
    const { data } = await apiClient.put<ApiSuccessResponse<SchoolProfile>>(
      '/settings/school',
      values,
    );
    return data.data;
  },

  async getAttendanceConfig(): Promise<AttendanceConfig> {
    const { data } = await apiClient.get<ApiSuccessResponse<AttendanceConfig>>(
      '/settings/attendance-config',
    );
    return data.data;
  },

  async updateAttendanceConfig(values: AttendanceConfigInput): Promise<AttendanceConfig> {
    const { data } = await apiClient.put<ApiSuccessResponse<AttendanceConfig>>(
      '/settings/attendance-config',
      values,
    );
    return data.data;
  },

  async getAcademicYear(): Promise<AcademicYear | null> {
    const { data } = await apiClient.get<ApiSuccessResponse<AcademicYear | null>>(
      '/settings/academic-year',
    );
    return data.data;
  },

  async listCalendar(): Promise<SchoolCalendarEntry[]> {
    const { data } = await apiClient.get<ApiSuccessResponse<SchoolCalendarEntry[]>>(
      '/settings/calendar',
    );
    return data.data;
  },

  async createCalendarEntry(values: CalendarEntryInput): Promise<SchoolCalendarEntry> {
    const { data } = await apiClient.post<ApiSuccessResponse<SchoolCalendarEntry>>(
      '/settings/calendar',
      values,
    );
    return data.data;
  },

  async updateCalendarEntry(
    id: number,
    values: CalendarEntryInput,
  ): Promise<SchoolCalendarEntry> {
    const { data } = await apiClient.put<ApiSuccessResponse<SchoolCalendarEntry>>(
      `/settings/calendar/${id}`,
      values,
    );
    return data.data;
  },

  async deleteCalendarEntry(id: number): Promise<void> {
    await apiClient.delete(`/settings/calendar/${id}`);
  },
};
