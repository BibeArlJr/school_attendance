<?php

namespace App\Modules\IdCard\Services;

use App\Modules\IdCard\Models\IdCard;
use App\Modules\Staff\Models\Staff;
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
        return $this->generate($student, 'student', 'STUDENT_CARD', 'STD');
    }

    public function generateForStaff(Staff $staff): IdCard
    {
        return $this->generate($staff, 'staff', 'STAFF_CARD', 'STF');
    }

    /**
     * The "lost card" workflow: deactivates the current active card (its
     * barcode_value is never reissued to anyone) and generates a fresh
     * one via a brand-new sequence value.
     */
    public function reissue(Student $student): IdCard
    {
        return DB::transaction(function () use ($student) {
            $this->deactivateActiveCard('student', $student->id);

            return $this->generateForStudent($student);
        });
    }

    public function reissueForStaff(Staff $staff): IdCard
    {
        return DB::transaction(function () use ($staff) {
            $this->deactivateActiveCard('staff', $staff->id);

            return $this->generateForStaff($staff);
        });
    }

    public function activeCardFor(Student $student): ?IdCard
    {
        return $this->findActiveCard('student', $student->id);
    }

    public function activeCardForStaff(Staff $staff): ?IdCard
    {
        return $this->findActiveCard('staff', $staff->id);
    }

    /**
     * Shared generation logic — Student and Staff both expose
     * school_id/id/school(), which is all this needs. A separate sequence
     * counter per owner type (entity_type keys
     * SequenceGeneratorService's per-school counter row); the prefix
     * itself already encodes both the school code and the type segment,
     * since the service just does "{prefix}-{padded number}".
     */
    private function generate(Student|Staff $owner, string $ownerType, string $entityType, string $prefix): IdCard
    {
        return DB::transaction(function () use ($owner, $ownerType, $entityType, $prefix) {
            $schoolCode = $owner->school->school_code;

            $barcodeValue = $this->sequenceGenerator->next(
                $owner->school_id,
                $entityType,
                "{$schoolCode}-{$prefix}",
            );

            return IdCard::create([
                'school_id' => $owner->school_id,
                'owner_type' => $ownerType,
                'owner_id' => $owner->id,
                'barcode_value' => $barcodeValue,
                'status' => 'active',
                'issued_date' => now()->toDateString(),
            ]);
        });
    }

    private function deactivateActiveCard(string $ownerType, int $ownerId): void
    {
        IdCard::query()
            ->where('owner_type', $ownerType)
            ->where('owner_id', $ownerId)
            ->where('status', 'active')
            ->update([
                'status' => 'deactivated',
                'deactivated_date' => now()->toDateString(),
            ]);
    }

    private function findActiveCard(string $ownerType, int $ownerId): ?IdCard
    {
        return IdCard::query()
            ->where('owner_type', $ownerType)
            ->where('owner_id', $ownerId)
            ->where('status', 'active')
            ->latest('id')
            ->first();
    }
}
