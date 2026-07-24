import type { ImportRowFlag } from './import';

export interface LocalRowDecision {
  resolution: 'pending' | 'accept' | 'skip';
  classId?: number;
  newClassName?: string;
  firstName?: string;
  lastName?: string;
}

export type LocalDecisions = Record<number, LocalRowDecision>;

/**
 * A row with zero flags is unambiguous — nothing to review — so it's
 * accepted by default unless the reviewer explicitly skips it. A flagged
 * row (unrecognized_class, possible_duplicate) always needs an explicit
 * decision and defaults to pending until one is made, whether via an
 * individual click, a bulk grade-group resolve, or "Accept all clean
 * rows". This is what caught the real bug: resolving every flagged row
 * and group, then committing, used to silently skip every already-clean
 * row too, because nothing had ever set an explicit decision for them.
 */
export function effectiveResolution(
  flags: ImportRowFlag[],
  explicit: LocalRowDecision['resolution'] | undefined,
): LocalRowDecision['resolution'] {
  if (explicit) {
    return explicit;
  }
  return flags.length === 0 ? 'accept' : 'pending';
}
