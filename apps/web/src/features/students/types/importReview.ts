export interface LocalRowDecision {
  resolution: 'pending' | 'accept' | 'skip';
  classId?: number;
  newClassName?: string;
  firstName?: string;
  lastName?: string;
}

export type LocalDecisions = Record<number, LocalRowDecision>;
