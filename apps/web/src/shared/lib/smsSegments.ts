/**
 * SMS encoding/segment/cost calculator (Prompt 50) — a real cost signal
 * for the SMS Templates editor, not decoration: a school editing its
 * message into something long shouldn't be surprised later by a higher
 * per-send credit cost. Pure client-side computation (no round trip) so
 * it can update on every keystroke.
 *
 * Standard GSM 03.38 / 3GPP TS 23.038 segmentation rules:
 * - GSM-7 (7-bit "default alphabet"): usable when every character is in
 *   the basic set (1 septet) or the extension set (2 septets, via an
 *   escape sequence). Single SMS: 160 septets. Concatenated (multipart):
 *   153 septets per segment — 7 septets are spent on the User Data
 *   Header (UDH) that links segments together.
 * - Unicode (UCS-2): required the moment ANY character falls outside
 *   GSM-7 — Devanagari (this project's actual default template
 *   language) always forces this. Single SMS: 70 characters.
 *   Concatenated: 67 characters per segment — UDH is 6 bytes = 3 UCS-2
 *   code units, so 70 - 3 = 67.
 *
 * Segmentation counts UTF-16 code units (`string.length`), not Unicode
 * code points or grapheme clusters — that's what actually matches how a
 * real SMS UCS-2 payload is built: a Devanagari base consonant plus a
 * combining vowel sign (matra) is ONE visual glyph but TWO separate
 * UCS-2 code units, and a real gateway bills for code units. Verified
 * against Sparrow's own real segmentation (Prompt 50 Part D) — this
 * matched their actual credit deduction, not just the on-paper spec.
 */

// GSM 03.38 basic character set — each costs 1 septet.
const GSM7_BASIC = new Set(
  '@£$¥èéùìòÇ\nØø\rÅå' +
    'Δ_ΦΓΛΩΠΨΣΘΞÆæßÉ' +
    ' !"#¤%&\'()*+,-./' +
    '0123456789:;<=>?' +
    '¡ABCDEFGHIJKLMNO' +
    'PQRSTUVWXYZÄÖÑÜ§' +
    '¿abcdefghijklmno' +
    'pqrstuvwxyzäöñüà',
);

// GSM 03.38 extension characters — each costs 2 septets (escape sequence
// 0x1B + the base septet).
const GSM7_EXTENDED = new Set(['^', '{', '}', '\\', '[', '~', ']', '|', '€', '\f']);

export type SmsEncoding = 'GSM-7' | 'Unicode';

export interface SmsSegmentInfo {
  encoding: SmsEncoding;
  /** Effective length for billing: septets for GSM-7 (extension chars count as 2), UTF-16 code units for Unicode. */
  length: number;
  segments: number;
  /** Characters usable in a single (non-concatenated) SMS at this encoding. */
  singleSegmentLimit: number;
  /** Characters usable per segment once concatenation is needed. */
  perSegmentLimit: number;
  /** Characters left in the current (last) segment before another segment is needed. */
  remainingInSegment: number;
}

function isGsm7Compatible(text: string): boolean {
  for (const char of text) {
    if (!GSM7_BASIC.has(char) && !GSM7_EXTENDED.has(char)) {
      return false;
    }
  }
  return true;
}

function gsm7Length(text: string): number {
  let length = 0;
  for (const char of text) {
    length += GSM7_EXTENDED.has(char) ? 2 : 1;
  }
  return length;
}

export function calculateSmsSegments(text: string): SmsSegmentInfo {
  if (text.length === 0) {
    return {
      encoding: 'GSM-7',
      length: 0,
      segments: 0,
      singleSegmentLimit: 160,
      perSegmentLimit: 153,
      remainingInSegment: 160,
    };
  }

  const encoding: SmsEncoding = isGsm7Compatible(text) ? 'GSM-7' : 'Unicode';
  const length = encoding === 'GSM-7' ? gsm7Length(text) : text.length;
  const singleSegmentLimit = encoding === 'GSM-7' ? 160 : 70;
  const perSegmentLimit = encoding === 'GSM-7' ? 153 : 67;

  const segments = length <= singleSegmentLimit ? 1 : Math.ceil(length / perSegmentLimit);
  const limitForRemaining = segments === 1 ? singleSegmentLimit : perSegmentLimit;
  const usedInLastSegment = length - (segments - 1) * limitForRemaining;
  const remainingInSegment = limitForRemaining - usedInLastSegment;

  return { encoding, length, segments, singleSegmentLimit, perSegmentLimit, remainingInSegment };
}
