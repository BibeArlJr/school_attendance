import { useQuery } from '@tanstack/react-query';
import { settingsApi } from '../api/settingsApi';

export function useSchoolProfile() {
  return useQuery({ queryKey: ['settings', 'school'], queryFn: settingsApi.getSchool });
}

export function useAttendanceConfig() {
  return useQuery({
    queryKey: ['settings', 'attendance-config'],
    queryFn: settingsApi.getAttendanceConfig,
  });
}

export function useAcademicYear() {
  return useQuery({ queryKey: ['settings', 'academic-year'], queryFn: settingsApi.getAcademicYear });
}

export function useCalendarEntries() {
  return useQuery({ queryKey: ['settings', 'calendar'], queryFn: settingsApi.listCalendar });
}

export function useLicense(enabled = true) {
  return useQuery({ queryKey: ['settings', 'license'], queryFn: settingsApi.getLicense, enabled });
}
