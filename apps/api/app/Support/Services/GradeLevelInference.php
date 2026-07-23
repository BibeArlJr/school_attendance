<?php

namespace App\Support\Services;

/**
 * Maps a class name to a display/sort-order grade level. Deliberately a
 * small, exact lookup — not a general parser — since guessing wrong on an
 * unrecognized name is worse than leaving grade_level null (which just
 * sorts that class after the resolved ones, never blocks creation).
 *
 * Four match attempts, in order, once a leading "class "/"grade " prefix
 * has been stripped: exact word-form lookup, bare integer 0-12, Roman
 * numeral I-XII. All are small fixed lookups (or a bounded numeric
 * range check) — never a general Roman-numeral or free-form parser.
 */
class GradeLevelInference
{
    private const LOOKUP = [
        'ecd' => 0,
        'one' => 1,
        'two' => 2,
        'three' => 3,
        'four' => 4,
        'five' => 5,
        'six' => 6,
        'seven' => 7,
        'eight' => 8,
        'nine' => 9,
        'ten' => 10,
        'eleven' => 11,
        'twelve' => 12,
    ];

    private const ROMAN_NUMERALS = [
        'i' => 1,
        'ii' => 2,
        'iii' => 3,
        'iv' => 4,
        'v' => 5,
        'vi' => 6,
        'vii' => 7,
        'viii' => 8,
        'ix' => 9,
        'x' => 10,
        'xi' => 11,
        'xii' => 12,
    ];

    public function infer(string $className): ?int
    {
        $normalized = $this->normalize($className);

        if (isset(self::LOOKUP[$normalized])) {
            return self::LOOKUP[$normalized];
        }

        if (ctype_digit($normalized)) {
            $asInt = (int) $normalized;

            return $asInt >= 0 && $asInt <= 12 ? $asInt : null;
        }

        return self::ROMAN_NUMERALS[$normalized] ?? null;
    }

    /**
     * Strips periods (real data spells ECD as "E.C.D." as often as
     * "ECD"), collapses whitespace, lowercases, then strips a leading
     * "class "/"grade " prefix — so "Class XII", "Grade 12", and bare
     * "XII" all normalize to the same value before any lookup runs.
     */
    private function normalize(string $className): string
    {
        $stripped = str_replace('.', '', $className);
        $normalized = strtolower(trim(preg_replace('/\s+/', ' ', $stripped)));

        return preg_replace('/^(class|grade)\s+/', '', $normalized);
    }
}
