import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { auditLogApi, type AuditLogListParams } from '../api/auditLogApi';

export function useAuditLogs(params: AuditLogListParams) {
  return useQuery({
    queryKey: ['platform', 'audit-log', params],
    queryFn: () => auditLogApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useAuditLogActions() {
  return useQuery({
    queryKey: ['platform', 'audit-log', 'actions'],
    queryFn: () => auditLogApi.actions(),
  });
}

export function useAuditLogActors() {
  return useQuery({
    queryKey: ['platform', 'audit-log', 'actors'],
    queryFn: () => auditLogApi.actors(),
  });
}
