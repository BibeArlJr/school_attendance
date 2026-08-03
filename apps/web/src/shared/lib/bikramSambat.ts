import { ADToBS, BSToAD } from 'bikram-sambat-js';

/**
 * Shared BS (Bikram Sambat) conversion utilities — the single source of
 * truth for AD↔BS conversion across the app (Prompt 27). Every BS date
 * input/display anywhere in this system should go through toBs/toAd/
 * formatBs here, not reimplement conversion locally.
 *
 * Built on bikram-sambat-js (MIT, zero runtime deps) rather than a
 * pre-built React date-picker package — every actively-maintained picker
 * package pins a `react: ^18` peer dependency that conflicts with this
 * app's React 19, and bikram-sambat-js's own data table bakes in real
 * Nepal-government calendar corrections for BS 2081/2082/2085/2088,
 * which is the actual hard part to get right and a strong signal it's
 * genuinely maintained, not abandoned.
 *
 * No PHP-side equivalent exists yet — nothing server-side renders or
 * accepts BS dates today (Settings/Reports/exports all read/write plain
 * Gregorian `date` columns; only the frontend ever displays BS). Add one
 * if/when a future prompt needs BS rendered server-side (e.g. a printed
 * PDF report) — deferred, not needed for this phase.
 */

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

/** bikram-sambat-js's real, hard supported range — confirmed empirically
 *  (BSToAD throws "BS year should be in range of 1970 to 2100" outside
 *  this), not documented anywhere in its README. The year-picker grid
 *  (BsCalendarGrid) must never offer a year outside this — it's not a
 *  stylistic choice, offering one would throw at conversion time. */
export const MIN_BS_YEAR = 1970;
export const MAX_BS_YEAR = 2100;

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

/** Parses an already-BS "YYYY-MM-DD" string into parts — exported (not
 *  just an internal helper of toBs) for the rare case where a value is
 *  already known to be BS text rather than an AD date needing
 *  conversion, e.g. the ~400 imported students that only ever had a
 *  free-text `dob_bs` and no `dob` at all (Prompt 28 Part A). */
export function parseBsDateString(bs: string): BsDate {
  const parts = bs.split('-');
  return { year: Number(parts[0]), month: Number(parts[1]), day: Number(parts[2]) };
}

/** AD date string (YYYY-MM-DD) -> BS parts. */
export function toBs(adDate: string): BsDate {
  return parseBsDateString(ADToBS(adDate));
}

/** BS parts -> AD date string (YYYY-MM-DD). */
export function toAd(date: BsDate): string {
  return BSToAD(bsDateToString(date));
}

/** BS parts -> a human-readable display string, e.g. "Ashadh 10, 2082
 *  BS" — the one formatting implementation every BS display in the app
 *  should call, so the format stays consistent everywhere. */
export function formatBsDate(date: BsDate): string {
  return `${BS_MONTH_NAMES[date.month - 1]} ${date.day}, ${date.year} BS`;
}

/** AD date string -> the same human-readable BS display string, via
 *  toBs + formatBsDate — the common case (you have a stored AD date and
 *  want to show it in BS) in one call. */
export function formatBs(adDate: string): string {
  return formatBsDate(toBs(adDate));
}

/**
 * bikram-sambat-js doesn't expose day-count-per-month publicly (it's a
 * private method on its BikramSambat class) — derived here instead via
 * two public BSToAD calls: the gap between the 1st of this BS month and
 * the 1st of the next is exactly this month's length. Wrapping Chaitra
 * (month 12) rolls into next BS year's Baishakh.
 */
export function daysInBsMonth(year: number, month: number): number {
  const thisMonthStart = new Date(toAd({ year, month, day: 1 }));
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonthStart = new Date(toAd({ year: nextYear, month: nextMonth, day: 1 }));

  return Math.round((nextMonthStart.getTime() - thisMonthStart.getTime()) / (1000 * 60 * 60 * 24));
}

/** Day of week (0=Sun..6=Sat) that a BS month starts on. */
export function bsMonthStartWeekday(year: number, month: number): number {
  return new Date(toAd({ year, month, day: 1 })).getDay();
}

export function todayBs(): BsDate {
  const today = new Date();
  const iso = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  return toBs(iso);
}

/** True if BS date `a` falls strictly before BS date `b` (calendar
 *  order, not numeric year/month/day comparison — needed since a naive
 *  numeric compare happens to work for this calendar's fields anyway,
 *  but this makes the intent explicit at range-picker call sites). */
export function isBsBefore(a: BsDate, b: BsDate): boolean {
  if (a.year !== b.year) return a.year < b.year;
  if (a.month !== b.month) return a.month < b.month;
  return a.day < b.day;
}
