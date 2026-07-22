<?php

namespace App\Support\Services;

use App\Support\Models\SequenceCounter;
use Illuminate\Support\Facades\DB;

/**
 * Generic, per-school, per-entity-type sequential number generator.
 * Reused by Student admission numbers now, and by Phase 7's barcode
 * numbers later — not specific to any one module.
 */
class SequenceGeneratorService
{
    public function next(int $schoolId, string $entityType, string $prefix, int $padLength = 6): string
    {
        return DB::transaction(function () use ($schoolId, $entityType, $prefix, $padLength) {
            // lockForUpdate() inside the transaction is what makes this
            // atomic: it takes a row-level lock, so a second concurrent
            // call blocks here until the first transaction commits (or
            // rolls back), rather than both reading the same
            // current_value and racing to write the same next number.
            $counter = SequenceCounter::query()
                ->where('school_id', $schoolId)
                ->where('entity_type', $entityType)
                ->lockForUpdate()
                ->first();

            if (! $counter) {
                $counter = SequenceCounter::create([
                    'school_id' => $schoolId,
                    'entity_type' => $entityType,
                    'prefix' => $prefix,
                    'current_value' => 0,
                ]);
            }

            $nextValue = $counter->current_value + 1;
            $counter->update(['current_value' => $nextValue]);

            return sprintf('%s-%s', $prefix, str_pad((string) $nextValue, $padLength, '0', STR_PAD_LEFT));
        });
    }
}
