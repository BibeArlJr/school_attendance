import { useState } from 'react';
import type { SchoolClass } from '../types';
import { Input } from '@/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';

const CREATE_NEW_VALUE = '__create_new__';

interface ClassPickerCellProps {
  classes: SchoolClass[];
  classId: number | undefined;
  newClassName: string | undefined;
  onChange: (value: { classId?: number; newClassName?: string }) => void;
}

/**
 * Resolves an unrecognized_class row: pick an existing class, or switch
 * to "Create new class" and type a name. Used only for flagged rows —
 * already-resolved rows just show the matched class name as plain text.
 */
export function ClassPickerCell({ classes, classId, newClassName, onChange }: ClassPickerCellProps) {
  const [creatingNew, setCreatingNew] = useState(newClassName !== undefined);

  function handleSelectChange(value: string) {
    if (value === CREATE_NEW_VALUE) {
      setCreatingNew(true);
      onChange({ newClassName: '' });
      return;
    }
    setCreatingNew(false);
    onChange({ classId: Number(value) });
  }

  if (creatingNew) {
    return (
      <div className="flex items-center gap-1">
        <Input
          autoFocus
          value={newClassName ?? ''}
          onChange={(event) => onChange({ newClassName: event.target.value })}
          placeholder="New class name"
          className="h-8 w-32"
        />
        <button
          type="button"
          className="text-xs text-muted-foreground hover:underline"
          onClick={() => {
            setCreatingNew(false);
            onChange({ classId: undefined });
          }}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <Select value={classId ? String(classId) : undefined} onValueChange={handleSelectChange}>
      <SelectTrigger className="h-8 w-40">
        <SelectValue placeholder="Map to class…" />
      </SelectTrigger>
      <SelectContent>
        {classes.map((schoolClass) => (
          <SelectItem key={schoolClass.id} value={String(schoolClass.id)}>
            {schoolClass.name}
            {schoolClass.section ? ` - ${schoolClass.section}` : ''}
          </SelectItem>
        ))}
        <SelectItem value={CREATE_NEW_VALUE}>+ Create new class</SelectItem>
      </SelectContent>
    </Select>
  );
}
