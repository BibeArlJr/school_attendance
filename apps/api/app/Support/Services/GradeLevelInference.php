<?php

namespace App\Support\Services;

/**
 * Maps a class name to a display/sort-order grade level. Deliberately a
 * small, exact lookup — not a general parser — since guessing wrong on an
 * unrecognized name is worse than leaving grade_level null (which just
 * sorts that class after the resolved ones, never blocks creation).
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

    public function infer(string $className): ?int
    {
        $normalized = strtolower(trim(preg_replace('/\s+/', ' ', $className)));

        return self::LOOKUP[$normalized] ?? null;
    }
}
