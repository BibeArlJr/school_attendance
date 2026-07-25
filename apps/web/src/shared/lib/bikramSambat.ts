import { ADToBS, BSToAD } from 'bikram-sambat-js';

export const BS_MONTH_NAMES = [
  'Baishakh',
  'Jestha',
  'Ashadh',
  'Shrawan',
  'Bhadra',
  'Ashwin',
  'Kartik',
  'Mangsir',
  'Poush',
  'Magh',
  'Falgun',
  'Chaitra',
];

export const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export interface BsDate {
  year: number;
  month: number; // 1-12
  day: number;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function bsDateToString(date: BsDate): string {
  return `${date.year}-${pad(date.month)}-${pad(date.day)}`;
}

function parseBsString(bs: string): BsDate {
  const parts = bs.split('-');
  return { year: Number(parts[0]), month: Number(parts[1]), day: Number(parts[2]) };
}

/** AD date string (YYYY-MM-DD) -> BS parts. */
export function adToBs(adDate: string): BsDate {
  return parseBsString(ADToBS(adDate));
}

/** BS parts -> AD date string (YYYY-MM-DD). */
export function bsToAd(date: BsDate): string {
  return BSToAD(bsDateToString(date));
}

/**
 * bikram-sambat-js doesn't expose day-count-per-month publicly (it's a
 * private method on its BikramSambat class) — derived here instead via
 * two public BSToAD calls: the gap between the 1st of this BS month and
 * the 1st of the next is exactly this month's length. Wrapping Chaitra
 * (month 12) rolls into next BS year's Baishakh.
 */
export function daysInBsMonth(year: number, month: number): number {
  const thisMonthStart = new Date(bsToAd({ year, month, day: 1 }));
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonthStart = new Date(bsToAd({ year: nextYear, month: nextMonth, day: 1 }));

  return Math.round((nextMonthStart.getTime() - thisMonthStart.getTime()) / (1000 * 60 * 60 * 24));
}

/** Day of week (0=Sun..6=Sat) that a BS month starts on. */
export function bsMonthStartWeekday(year: number, month: number): number {
  return new Date(bsToAd({ year, month, day: 1 })).getDay();
}

export function todayBs(): BsDate {
  const today = new Date();
  const iso = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  return adToBs(iso);
}
