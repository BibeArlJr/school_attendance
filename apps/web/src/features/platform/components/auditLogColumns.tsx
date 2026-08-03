import type { ColumnDef } from '@tanstack/react-table';
import type { AuditLogEntry } from '../types/auditLog';
import { Button } from '@/shared/components/ui/button';
import { formatDateTime12h } from '@/shared/lib/time';

interface BuildAuditLogColumnsArgs {
  onViewDetails: (entry: AuditLogEntry) => void;
}

/** Snake_case action -> readable label — "student.deleted" -> "Student deleted". */
function actionLabel(action: string): string {
  const [entity, ...rest] = action.split('.');
  const verb = rest.join('.');
  if (!entity || !verb) return action;
  return `${entity.charAt(0).toUpperCase()}${entity.slice(1)} ${verb.replace(/_/g, ' ')}`;
}

export function buildAuditLogColumns({ onViewDetails }: BuildAuditLogColumnsArgs): ColumnDef<AuditLogEntry>[] {
  return [
    {
      accessorKey: 'created_at',
      header: 'When',
      cell: ({ row }) => formatDateTime12h(row.original.created_at),
    },
    {
      id: 'actor',
      header: 'Actor',
      cell: ({ row }) =>
        row.original.actor ? (
          <div>
            <div className="font-medium">{row.original.actor.name}</div>
            <div className="text-xs text-muted-foreground">{row.original.actor.email}</div>
          </div>
        ) : (
          <span className="text-muted-foreground">System</span>
        ),
    },
    {
      id: 'school',
      header: 'School',
      cell: ({ row }) => row.original.school?.name ?? <span className="text-muted-foreground">Platform-level</span>,
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ row }) => actionLabel(row.original.action),
    },
    {
      id: 'entity',
      header: 'Entity',
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.entity_type}
          {row.original.entity_id !== null ? ` #${row.original.entity_id}` : ''}
        </span>
      ),
    },
    {
      id: 'details',
      header: '',
      cell: ({ row }) => (
        <Button variant="outline" size="sm" onClick={() => onViewDetails(row.original)}>
          Details
        </Button>
      ),
    },
  ];
}
