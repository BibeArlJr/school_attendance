import type {
  AcademicYear,
  AttendanceConfig,
  License,
  SchoolCalendarEntry,
  SchoolProfile,
  SmsTemplateDescription,
  SmsTemplates,
  SmsTemplateType,
} from '../types';
import { apiClient } from '@/shared/lib/apiClient';
import type { ApiSuccessResponse } from '@/shared/types';

export interface SchoolProfileInput {
  name: string;
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

export interface CalendarRangeInput {
  start_date: string;
  end_date: string;
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

  async uploadLogo(file: File): Promise<SchoolProfile> {
    const formData = new FormData();
    formData.append('logo', file);
    const { data } = await apiClient.post<ApiSuccessResponse<SchoolProfile>>(
      '/settings/school/logo',
      formData,
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

  async createCalendarRange(values: CalendarRangeInput): Promise<SchoolCalendarEntry[]> {
    const { data } = await apiClient.post<ApiSuccessResponse<SchoolCalendarEntry[]>>(
      '/settings/calendar/range',
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

  async getLicense(): Promise<License> {
    const { data } = await apiClient.get<ApiSuccessResponse<License>>('/settings/license');
    return data.data;
  },

  async getSmsTemplates(): Promise<SmsTemplates> {
    const { data } = await apiClient.get<ApiSuccessResponse<SmsTemplates>>(
      '/settings/sms-templates',
    );
    return data.data;
  },

  // Empty/blank templateText removes this school's override (falls back
  // to the platform default) — see UpdateSmsTemplateRequest's docblock.
  async updateSmsTemplate(
    type: SmsTemplateType,
    templateText: string,
  ): Promise<SmsTemplateDescription> {
    const { data } = await apiClient.put<ApiSuccessResponse<SmsTemplateDescription>>(
      `/settings/sms-templates/${type}`,
      { template_text: templateText },
    );
    return data.data;
  },

  // super_admin only (403 otherwise) — the platform-wide fallback every
  // other school without an override relies on.
  async updatePlatformSmsTemplate(
    type: SmsTemplateType,
    templateText: string,
  ): Promise<{ type: SmsTemplateType; platform_default_text: string }> {
    const { data } = await apiClient.put<
      ApiSuccessResponse<{ type: SmsTemplateType; platform_default_text: string }>
    >(`/settings/sms-templates/platform/${type}`, { template_text: templateText });
    return data.data;
  },
};
