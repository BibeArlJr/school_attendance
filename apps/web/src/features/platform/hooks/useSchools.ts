import { useQuery } from '@tanstack/react-query';
import { platformApi } from '../api/platformApi';

export function useSchools() {
  return useQuery({ queryKey: ['platform', 'schools'], queryFn: platformApi.listSchools });
}
