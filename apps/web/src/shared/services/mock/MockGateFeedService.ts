import type { GateFeedService } from '@/features/gate-feed/types';
import type { GateEvent } from '@/shared/types';

const CLASS_NAMES = [
  'Grade 1 - A',
  'Grade 2 - B',
  'Grade 3 - A',
  'Grade 4 - C',
  'Grade 5 - B',
  'Grade 6 - A',
];

const STUDENT_NAMES = [
  'Aarav Sharma',
  'Priya Thapa',
  'Bibek Gurung',
  'Sita Rai',
  'Nabin Shrestha',
  'Anjali Poudel',
  'Rohan Karki',
  'Sabina Magar',
  'Suraj Adhikari',
  'Kritika Basnet',
  'Dipesh Tamang',
  'Nisha Lama',
  'Prakash Bhattarai',
  'Manisha Chettri',
  'Sandeep Rana',
  'Puja Khadka',
  'Bishal Neupane',
  'Sunita Dahal',
];

const SMS_STATUSES: GateEvent['smsStatus'][] = [
  'sent',
  'sent',
  'sent',
  'sent',
  'pending',
  'failed',
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem<T>(items: T[]): T {
  return items[randomInt(0, items.length - 1)] as T;
}

interface Student {
  name: string;
  className: string;
}

export class MockGateFeedService implements GateFeedService {
  private readonly students: Student[] = STUDENT_NAMES.map((name) => ({
    name,
    className: randomItem(CLASS_NAMES),
  }));

  private readonly listeners = new Set<(event: GateEvent) => void>();
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  subscribe(onEvent: (event: GateEvent) => void): () => void {
    this.listeners.add(onEvent);
    this.ensureRunning();

    return () => {
      this.listeners.delete(onEvent);
      if (this.listeners.size === 0) this.stop();
    };
  }

  private ensureRunning(): void {
    if (this.timeoutId !== null) return;
    this.scheduleNext();
  }

  private stop(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  private scheduleNext(): void {
    // Randomized 4-8s delay, not a fixed interval — reads more like a real
    // scanner with irregular foot traffic than a metronome.
    const delay = randomInt(4000, 8000);
    this.timeoutId = setTimeout(() => {
      this.emit();
      this.scheduleNext();
    }, delay);
  }

  private emit(): void {
    const student = randomItem(this.students);
    const event: GateEvent = {
      id: crypto.randomUUID(),
      studentName: student.name,
      className: student.className,
      timestamp: new Date().toISOString(),
      type: Math.random() > 0.5 ? 'entry' : 'exit',
      smsStatus: randomItem(SMS_STATUSES),
    };

    this.listeners.forEach((listener) => listener(event));
  }
}
