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
 * Guesses the school's existing "PREFIX N" naming convention from any
 * already-graded class (e.g. "Grade 1" -> prefix "Grade ") so the
 * suggested new-class name matches what's already in the database,
 * rather than always hardcoding "Grade N".
 */
export function suggestClassName(classes: SchoolClass[], gradeLevel: number): string {
  const graded = classes.find((c) => c.grade_level !== null);
  const match = graded?.name.match(/^(.*?)(\d+)\s*$/);
  if (match) {
    return `${match[1]}${gradeLevel}`;
  }
  return `Grade ${gradeLevel}`;
}

interface GradeGroupCardProps {
  gradeLevel: number;
  rows: ImportBatchRow[];
  classes: SchoolClass[];
  onApply: (rowIds: number[], patch: { classId?: number; newClassName?: string }) => void;
}

export function GradeGroupCard({ gradeLevel, rows, classes, onApply }: GradeGroupCardProps) {
  const [existingClassId, setExistingClassId] = useState<string | undefined>(undefined);
  const [newClassName, setNewClassName] = useState(() => suggestClassName(classes, gradeLevel));

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
