import { useQuery } from '@tanstack/react-query';
import { attendanceApi } from '../api/attendanceApi';

export function useGateCalendar() {
  return useQuery({ queryKey: ['attendance', 'gate-calendar'], queryFn: attendanceApi.gateCalendar });
}
