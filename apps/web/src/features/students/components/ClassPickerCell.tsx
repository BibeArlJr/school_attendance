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
 *
 * `creatingNew` is derived from `newClassName` (not its own useState)
 * so a row's display stays correct even when its decision is set from
 * outside this component — e.g. the "create all + resolve all groups"
 * bulk action, which sets `newClassName` on many rows at once without
 * this cell ever being interacted with directly. A plain `useState`
 * initializer only runs once at mount and would freeze this cell on
 * "Map to class…" forever in that case, even though the row's actual
 * decision was already resolved.
 */
export function ClassPickerCell({ classes, classId, newClassName, onChange }: ClassPickerCellProps) {
  const creatingNew = newClassName !== undefined;
  // Only autofocus when *this* cell's own dropdown triggered the switch —
  // not when many rows enter "creatingNew" simultaneously via the bulk
  // action, which would otherwise fight over focus across hundreds of rows.
  const [userTriggeredCreate, setUserTriggeredCreate] = useState(false);

  function handleSelectChange(value: string) {
    if (value === CREATE_NEW_VALUE) {
      setUserTriggeredCreate(true);
      onChange({ newClassName: '' });
      return;
    }
    onChange({ classId: Number(value), newClassName: undefined });
  }

  if (creatingNew) {
    return (
      <div className="flex items-center gap-1">
        <Input
          autoFocus={userTriggeredCreate}
          value={newClassName ?? ''}
          onChange={(event) => onChange({ newClassName: event.target.value })}
          placeholder="New class name"
          className="h-8 w-32"
        />
        <button
          type="button"
          className="text-xs text-muted-foreground hover:underline"
          onClick={() => {
            setUserTriggeredCreate(false);
            onChange({ classId: undefined, newClassName: undefined });
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
