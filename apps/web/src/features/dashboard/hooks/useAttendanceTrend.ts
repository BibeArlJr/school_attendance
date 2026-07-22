import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { dashboardApi } from '../api/dashboardApi';

export function useAttendanceTrend() {
  const query = useQuery({
    queryKey: ['dashboard', 'attendance-trend'],
    queryFn: dashboardApi.getAttendanceTrend,
  });

  useEffect(() => {
    if (query.isError) {
      toast.error('Could not load the attendance trend.');
    }
  }, [query.isError]);

  return query;
}
