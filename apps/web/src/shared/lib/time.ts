/**
 * Shared 12-hour time display (Prompt 38) — same principle as
 * bikramSambat.ts's BS calendar conversion: storage/API payloads stay
 * 24-hour ("HH:MM" or "HH:MM:SS"), only the display layer converts.
 * Time-of-day formatting is identical in AD and BS (there's no "BS
 * time," only BS dates), so this deliberately isn't folded into
 * bikramSambat.ts — a separate, narrower module for a separate concern.
 */

/** "14:05" or "14:05:00" -> "2:05 PM". */
export function formatTime12h(time: string): string {
  const [hoursStr, minutesStr] = time.split(':');
  const hours = Number(hoursStr);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHours}:${minutesStr} ${period}`;
}

/**
 * Full ISO datetime -> locale date + guaranteed-12-hour time (e.g.
 * "7/25/2026, 11:38 PM"), for timestamp columns/fields (SMS sent_at,
 * anomaly scanned_at) that show both a date and a time. Only the date
 * portion is browser-locale-dependent — the time portion always goes
 * through formatTime12h so it can never silently render 24-hour on a
 * non-US-locale machine.
 */
export function formatDateTime12h(isoDateTime: string): string {
  const date = new Date(isoDateTime);
  const datePart = date.toLocaleDateString();
  const timePart = formatTime12h(`${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`);
  return `${datePart}, ${timePart}`;
}
