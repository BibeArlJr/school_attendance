<?php

namespace App\Modules\IdCard\Services;

use App\Modules\IdCard\Models\IdCard;
use App\Modules\Student\Models\Student;
use App\Support\Services\SequenceGeneratorService;
use Illuminate\Support\Facades\DB;

class IdCardService
{
    public function __construct(private readonly SequenceGeneratorService $sequenceGenerator)
    {
    }

    public function generateForStudent(Student $student): IdCard
    {
        return DB::transaction(function () use ($student) {
            $schoolCode = $student->school->school_code;

            // A separate counter from STUDENT_ADMISSION (entity_type keys
            // SequenceGeneratorService's per-school counter row) — the
            // prefix itself already encodes both the school code and the
            // '-STD-' segment, since the service just does
            // "{prefix}-{padded number}".
            $barcodeValue = $this->sequenceGenerator->next(
                $student->school_id,
                'STUDENT_CARD',
                "{$schoolCode}-STD",
            );

            return IdCard::create([
                'school_id' => $student->school_id,
                'owner_type' => 'student',
                'owner_id' => $student->id,
                'barcode_value' => $barcodeValue,
                'status' => 'active',
                'issued_date' => now()->toDateString(),
            ]);
        });
    }

    /**
     * The "lost card" workflow: deactivates the current active card (its
     * barcode_value is never reissued to anyone) and generates a fresh
     * one via a brand-new sequence value.
     */
    public function reissue(Student $student): IdCard
    {
        return DB::transaction(function () use ($student) {
            IdCard::query()
                ->where('owner_type', 'student')
                ->where('owner_id', $student->id)
                ->where('status', 'active')
                ->update([
                    'status' => 'deactivated',
                    'deactivated_date' => now()->toDateString(),
                ]);

            return $this->generateForStudent($student);
        });
    }

    public function activeCardFor(Student $student): ?IdCard
    {
        return IdCard::query()
            ->where('owner_type', 'student')
            ->where('owner_id', $student->id)
            ->where('status', 'active')
            ->latest('id')
            ->first();
    }
}
