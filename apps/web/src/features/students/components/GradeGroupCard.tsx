import { useState } from 'react';
import type { SchoolClass } from '../types';
import type { ImportBatchRow } from '../types/import';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';

/**
 * grade_level is a sort key, never a display name — "ECD" and "Grade 1"
 * can both be grade_level 0/1 in the source data, and templating
 * "Grade {N}" would silently rename ECD to "Grade 0". Instead, use
 * whatever the source spreadsheet actually called this grade: the most
 * common raw class_name_raw value among the group's rows (normalized
 * for case/whitespace only when tallying — the winning entry's original
 * text, unaltered, is what's returned).
 */
function suggestClassNameFromRows(rows: ImportBatchRow[]): string | null {
  const counts = new Map<string, { count: number; original: string }>();
  for (const row of rows) {
    const raw = row.proposed_data.class_name_raw.trim();
    if (!raw) {
      continue;
    }
    const key = raw.toLowerCase().replace(/\s+/g, ' ');
    const existing = counts.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(key, { count: 1, original: raw });
    }
  }

  let best: { count: number; original: string } | null = null;
  for (const entry of counts.values()) {
    if (!best || entry.count > best.count) {
      best = entry;
    }
  }
  return best?.original ?? null;
}

/**
 * Fallback only for the edge case where a group's rows have no usable
 * raw class name text at all — guesses the school's existing "PREFIX N"
 * naming convention from any already-graded class (e.g. "Grade 1" ->
 * prefix "Grade ") rather than leaving the field blank.
 */
function suggestClassNameFallback(classes: SchoolClass[], gradeLevel: number): string {
  const graded = classes.find((c) => c.grade_level !== null);
  const match = graded?.name.match(/^(.*?)(\d+)\s*$/);
  if (match) {
    return `${match[1]}${gradeLevel}`;
  }
  return `Grade ${gradeLevel}`;
}

export function suggestClassName(rows: ImportBatchRow[], classes: SchoolClass[], gradeLevel: number): string {
  return suggestClassNameFromRows(rows) ?? suggestClassNameFallback(classes, gradeLevel);
}

interface GradeGroupCardProps {
  gradeLevel: number;
  rows: ImportBatchRow[];
  classes: SchoolClass[];
  onApply: (rowIds: number[], patch: { classId?: number; newClassName?: string }) => void;
}

export function GradeGroupCard({ gradeLevel, rows, classes, onApply }: GradeGroupCardProps) {
  const [existingClassId, setExistingClassId] = useState<string | undefined>(undefined);
  const [newClassName, setNewClassName] = useState(() => suggestClassName(rows, classes, gradeLevel));

  const rowIds = rows.map((row) => row.id);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {rows.length} row{rows.length === 1 ? '' : 's'} → Grade {gradeLevel} (no matching class)
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-end gap-6">
        <div className="flex items-end gap-2">
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Map to an existing class</p>
            <Select value={existingClassId} onValueChange={setExistingClassId}>
              <SelectTrigger className="h-8 w-44">
                <SelectValue placeholder="Choose a class…" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((schoolClass) => (
                  <SelectItem key={schoolClass.id} value={String(schoolClass.id)}>
                    {schoolClass.name}
                    {schoolClass.section ? ` - ${schoolClass.section}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={!existingClassId}
            onClick={() => onApply(rowIds, { classId: Number(existingClassId) })}
          >
            Apply to all {rows.length}
          </Button>
        </div>

        <div className="flex items-end gap-2">
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Or create a new class</p>
            <Input
              value={newClassName}
              onChange={(event) => setNewClassName(event.target.value)}
              className="h-8 w-44"
            />
          </div>
          <Button
            size="sm"
            disabled={!newClassName.trim()}
            onClick={() => onApply(rowIds, { newClassName: newClassName.trim() })}
          >
            Create and apply to all
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
