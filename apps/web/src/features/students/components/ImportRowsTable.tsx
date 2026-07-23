import { Check, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useState } from 'react';
import type { SchoolClass } from '../types';
import type { ImportBatchRow } from '../types/import';
import type { LocalDecisions } from '../types/importReview';
import { ClassPickerCell } from './ClassPickerCell';
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
  unrecognized_class: 'Unrecognized class',
  possible_duplicate: 'Possible duplicate',
};

interface ImportRowsTableProps {
  rows: ImportBatchRow[];
  classes: SchoolClass[];
  decisions: LocalDecisions;
  onDecisionChange: (rowId: number, patch: Partial<LocalDecisions[number]>) => void;
}

export function ImportRowsTable({ rows, classes, decisions, onDecisionChange }: ImportRowsTableProps) {
  const [pageIndex, setPageIndex] = useState(0);
  const pageCount = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const pageRows = rows.slice(pageIndex * PER_PAGE, pageIndex * PER_PAGE + PER_PAGE);

  function describeDuplicates(row: ImportBatchRow): string {
    return row.proposed_data.duplicate_matches
      .map((match) =>
        match.type === 'existing_student'
          ? `existing student #${match.student_id}`
          : `${match.sheet_name} row ${match.row_number}`,
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
              <TableHead>Class</TableHead>
              <TableHead>DOB (BS)</TableHead>
              <TableHead>Guardian</TableHead>
              <TableHead>Flags</TableHead>
              <TableHead>Decision</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((row) => {
              const decision = decisions[row.id] ?? { resolution: 'pending' };
              const isUnrecognizedClass = row.flags.includes('unrecognized_class');
              const isDuplicate = row.flags.includes('possible_duplicate');

              return (
                <TableRow key={row.id}>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {row.sheet_name} #{row.row_number}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Input
                        value={decision.firstName ?? row.proposed_data.first_name}
                        onChange={(event) => onDecisionChange(row.id, { firstName: event.target.value })}
                        className="h-8 w-24"
                      />
                      <Input
                        value={decision.lastName ?? row.proposed_data.last_name}
                        onChange={(event) => onDecisionChange(row.id, { lastName: event.target.value })}
                        className="h-8 w-24"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    {isUnrecognizedClass ? (
                      <ClassPickerCell
                        classes={classes}
                        classId={decision.classId ?? row.proposed_data.suggested_class_id ?? undefined}
                        newClassName={decision.newClassName}
                        onChange={(value) =>
                          onDecisionChange(row.id, { classId: value.classId, newClassName: value.newClassName })
                        }
                      />
                    ) : (
                      <span className="text-sm">{row.proposed_data.class_name_raw}</span>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">{row.proposed_data.dob_bs ?? '—'}</TableCell>
                  <TableCell className="text-sm">
                    <div>{row.proposed_data.guardian_name ?? '—'}</div>
                    <div className="text-xs text-muted-foreground">{row.proposed_data.guardian_phone ?? ''}</div>
                    {isDuplicate && (
                      <div className="mt-1 text-xs text-amber-600">Matches {describeDuplicates(row)}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {row.flags.map((flag) => (
                        <Badge key={flag} variant="outline" className="text-xs">
                          {FLAG_LABELS[flag] ?? flag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        size="icon-sm"
                        variant={decision.resolution === 'accept' ? 'default' : 'outline'}
                        aria-label="Accept row"
                        onClick={() => onDecisionChange(row.id, { resolution: 'accept' })}
                      >
                        <Check className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant={decision.resolution === 'skip' ? 'destructive' : 'outline'}
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
