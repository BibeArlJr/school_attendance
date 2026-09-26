<?php

namespace App\Modules\BulkSms\Services;

/**
 * The one place a Nepali mobile number's shape is validated in this
 * codebase — every existing phone field elsewhere (guardian_phone,
 * chairman_phone, ParentGuardian.phone) is stored as free text with no
 * format enforcement at all; the only prior art is
 * RealSparrowSmsService::normalizePhone(), which is private, send-time-
 * only, and deliberately not touched or shared here (this module must
 * never depend on or modify the attendance SMS code path). This is an
 * independent reimplementation, not a copy — same country-code-stripping
 * idea, materially more conservative about what it accepts.
 *
 * Deliberately explicit and staged, not a blind "strip all leading
 * zeros" — a malformed input (e.g. a country code stripped down to a
 * remainder that ISN'T a real 10-digit mobile number) must stay invalid,
 * never get silently "fixed" into something that happens to look valid.
 * No carrier-prefix whitelist yet (by design) — only length and the
 * leading '9' are checked.
 */
class BulkSmsPhoneNormalizer
{
    /** Formatting characters stripped before any digit inspection —
     *  never a blanket non-digit strip, which would silently discard a
     *  stray letter instead of flagging the input as malformed. */
    private const FORMATTING_CHARS = [' ', '-', '(', ')', '+'];

    /**
     * @return array{normalized: ?string, valid: bool, reason: ?string}
     */
    public function normalize(?string $raw): array
    {
        $trimmed = trim((string) $raw);

        if ($trimmed === '') {
            return $this->invalid('Phone number is empty.');
        }

        $cleaned = str_replace(self::FORMATTING_CHARS, '', $trimmed);

        if ($cleaned === '') {
            return $this->invalid('No digits found.');
        }

        if (! ctype_digit($cleaned)) {
            return $this->invalid('Contains characters other than digits and formatting (spaces, dashes, parentheses, +).');
        }

        $digits = $cleaned;

        // Longest, most specific country-code form checked first —
        // '00977' and '977' never actually overlap as prefixes of the
        // same string ('00977...' starts with '009', not '977'), but
        // checking the more specific form first is the safer habit.
        if (str_starts_with($digits, '00977')) {
            $remainder = substr($digits, 5);
        } elseif (str_starts_with($digits, '977')) {
            $remainder = substr($digits, 3);
        } elseif (str_starts_with($digits, '0') && strlen($digits) === 11) {
            // Plain domestic form with the normal trunk '0' — exactly
            // one leading zero stripped, and only when no country code
            // was recognized. A country code followed by ANOTHER leading
            // zero (e.g. '0977...') is not a real, valid combination and
            // is deliberately left alone below, where it will fail the
            // final length/prefix check as malformed rather than being
            // guessed at.
            $remainder = substr($digits, 1);
        } else {
            $remainder = $digits;
        }

        if (strlen($remainder) !== 10) {
            return $this->invalid(sprintf(
                'Expected exactly 10 digits after removing the country code, found %d.',
                strlen($remainder),
            ));
        }

        if ($remainder[0] !== '9') {
            return $this->invalid('Nepali mobile numbers must start with 9.');
        }

        return ['normalized' => $remainder, 'valid' => true, 'reason' => null];
    }

    /**
     * @return array{normalized: ?string, valid: bool, reason: ?string}
     */
    private function invalid(string $reason): array
    {
        return ['normalized' => null, 'valid' => false, 'reason' => $reason];
    }
}
