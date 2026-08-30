import type { StaffImportRowFlag } from './import';

export interface LocalStaffRowDecision {
  resolution: 'pending' | 'accept' | 'skip';
  name?: string;
}

export type LocalStaffDecisions = Record<number, LocalStaffRowDecision>;

// Same default as the student import review's effectiveResolution — a
// row with zero flags is unambiguous and defaults to accept; a flagged
// row (possible_duplicate) defaults to pending until the reviewer makes
// an explicit call. 'no_citizenship_number' is deliberately NOT in that
// set — informational only, never forces a pending default on its own.
export function effectiveStaffResolution(
  flags: StaffImportRowFlag[],
  explicit: LocalStaffRowDecision['resolution'] | undefined,
): LocalStaffRowDecision['resolution'] {
  if (explicit) {
    return explicit;
  }
  return flags.includes('possible_duplicate') ? 'pending' : 'accept';
}
