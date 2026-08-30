import { Check, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useState } from 'react';
import type { StaffImportBatchRow } from '../types/import';
import { effectiveStaffResolution, type LocalStaffDecisions } from '../types/importReview';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';

const PER_PAGE = 25;

const FLAG_LABELS: Record<string, string> = {
  possible_duplicate: 'Possible duplicate',
  no_citizenship_number: 'No citizenship number',
};

interface StaffImportRowsTableProps {
  rows: StaffImportBatchRow[];
  decisions: LocalStaffDecisions;
  onDecisionChange: (rowId: number, patch: Partial<LocalStaffDecisions[number]>) => void;
}

// No class-picker column (unlike ImportRowsTable for students) — staff
// has no class-matching subsystem at all (Part H). Name is the only
// reviewer-editable override the backend accepts (CommitStaffImportRequest).
export function StaffImportRowsTable({ rows, decisions, onDecisionChange }: StaffImportRowsTableProps) {
  const [pageIndex, setPageIndex] = useState(0);
  const pageCount = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const pageRows = rows.slice(pageIndex * PER_PAGE, pageIndex * PER_PAGE + PER_PAGE);

  // Matches on citizenship_number when present, name+mobile otherwise —
  // same real-identifier-first fallback the backend uses (Part H spec).
  function describeDuplicates(row: StaffImportBatchRow): string {
    return row.proposed_data.duplicate_matches
      .map((match) =>
        match.type === 'existing_staff'
          ? `matches existing staff #${match.staff_id}`
          : `matches ${match.sheet_name} row ${match.row_number}`,
      )
      .join(', ');
  }

  return (
    <div className="space-y-3">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sheet / Row</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead>Citizenship No.</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>Flags</TableHead>
              <TableHead>Decision</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((row) => {
              const decision = decisions[row.id] ?? { resolution: 'pending' };
              const resolution = effectiveStaffResolution(row.flags, decisions[row.id]?.resolution);
              const isDuplicate = row.flags.includes('possible_duplicate');

              return (
                <TableRow key={row.id}>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {row.sheet_name} #{row.row_number}
                  </TableCell>
                  <TableCell>
                    <Input
                      value={decision.name ?? row.proposed_data.name}
                      onChange={(event) => onDecisionChange(row.id, { name: event.target.value })}
                      className="h-8 w-40"
                    />
                  </TableCell>
                  <TableCell className="text-sm">{row.proposed_data.designation ?? '—'}</TableCell>
                  <TableCell className="text-sm">{row.proposed_data.citizenship_number ?? '—'}</TableCell>
                  <TableCell className="text-sm">{row.proposed_data.mobile ?? '—'}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {row.flags.map((flag) => (
                        <Badge key={flag} variant="outline" className="text-xs">
                          {FLAG_LABELS[flag] ?? flag}
                        </Badge>
                      ))}
                    </div>
                    {isDuplicate && (
                      <div className="mt-1 text-xs text-amber-600">{describeDuplicates(row)}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        size="icon-sm"
                        variant={resolution === 'accept' ? 'default' : 'outline'}
                        aria-label="Accept row"
                        onClick={() => onDecisionChange(row.id, { resolution: 'accept' })}
                      >
                        <Check className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant={resolution === 'skip' ? 'destructive' : 'outline'}
                        aria-label="Skip row"
                        onClick={() => onDecisionChange(row.id, { resolution: 'skip' })}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{rows.length} rows</span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageIndex((current) => current - 1)}
            disabled={pageIndex <= 0}
          >
            <ChevronLeft className="size-4" />
            Previous
          </Button>
          <span>
            Page {pageIndex + 1} of {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageIndex((current) => current + 1)}
            disabled={pageIndex + 1 >= pageCount}
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
