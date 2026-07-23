<?php

namespace App\Modules\Import\Services;

use App\Modules\Import\Models\ImportBatch;
use App\Modules\Import\Models\ImportBatchRow;
use App\Modules\ParentGuardian\Services\ParentGuardianLinkService;
use App\Modules\School\Services\SchoolClassService;
use App\Modules\Student\Services\StudentService;
use App\Support\Enums\ImportBatchStatus;
use App\Support\Enums\ImportRowResolution;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use Throwable;

/**
 * Turns a reviewer's per-row accept/skip decisions into real students —
 * by calling StudentService::create(), ParentGuardianLinkService::link(),
 * and SchoolClassService::create() exactly as the manual Student/Class/
 * Guardian creation flows do. No parallel creation logic: this class only
 * resolves what to pass to those services, per Prompt 9's architecture
 * constraint.
 */
class ImportCommitService
{
    public function __construct(
        private readonly StudentService $studentService,
        private readonly ParentGuardianLinkService $guardianLinkService,
        private readonly SchoolClassService $classService,
    ) {
    }

    /**
     * @param  array<int, array<string, mixed>>  $rowDecisions  keyed by ImportBatchRow id
     * @return array{created: int, skipped: int, errors: list<array<string, mixed>>}
     */
    public function commit(ImportBatch $batch, array $rowDecisions, int $schoolId): array
    {
        $created = 0;
        $skipped = 0;
        $errors = [];
        /** @var array<string, int> $createdClassesByName normalized new-class name => class_id, scoped to this commit call so 12 rows requesting the same new class don't create 12 classes. */
        $createdClassesByName = [];

        foreach ($batch->rows as $row) {
            $decision = $rowDecisions[$row->id] ?? ['resolution' => 'skip'];

            if (($decision['resolution'] ?? 'skip') !== 'accept') {
                $row->update(['resolution' => ImportRowResolution::Skip]);
                $skipped++;

                continue;
            }

            // One bad row must not abort the rest of the batch — each
            // accepted row gets its own transaction, and a failure here is
            // caught and reported rather than propagated.
            try {
                DB::transaction(function () use ($row, $decision, $schoolId, &$createdClassesByName) {
                    $this->commitRow($row, $decision, $schoolId, $createdClassesByName);
                });
                $created++;
            } catch (Throwable $e) {
                $errors[] = [
                    'row_id' => $row->id,
                    'row_number' => $row->row_number,
                    'sheet_name' => $row->sheet_name,
                    'message' => $e->getMessage(),
                ];
                $skipped++;
            }
        }

        $batch->update([
            'status' => ImportBatchStatus::Committed,
            'imported_count' => $created,
            'skipped_count' => $skipped,
        ]);

        return ['created' => $created, 'skipped' => $skipped, 'errors' => $errors];
    }

    /**
     * @param  array<string, mixed>  $decision
     * @param  array<string, int>  $createdClassesByName
     */
    private function commitRow(ImportBatchRow $row, array $decision, int $schoolId, array &$createdClassesByName): void
    {
        $proposed = $row->proposed_data;

        $classId = $this->resolveClassId($decision, $proposed, $schoolId, $createdClassesByName);

        $firstName = trim((string) ($decision['first_name'] ?? $proposed['first_name'] ?? ''));
        $lastName = trim((string) ($decision['last_name'] ?? $proposed['last_name'] ?? ''));

        if ($firstName === '') {
            throw new RuntimeException("Row {$row->row_number} ({$row->sheet_name}): missing student name.");
        }

        $student = $this->studentService->create([
            'class_id' => $classId,
            'first_name' => $firstName,
            'last_name' => $lastName,
            'dob' => null,
            'gender' => null,
            // Not present in the source data — the date of import is the
            // most defensible default for a bulk-imported historical
            // roster where the real admission date is unknown.
            'admission_date' => now()->toDateString(),
            'address' => $proposed['address'] ?? null,
            'dob_bs' => $proposed['dob_bs'] ?? null,
            'import_batch_id' => $row->import_batch_id,
            'roll_no' => $proposed['roll_no'] ?? null,
        ], $schoolId);

        $guardianName = trim((string) ($proposed['guardian_name'] ?? ''));
        $guardianPhone = trim((string) ($proposed['guardian_phone'] ?? ''));

        if ($guardianName !== '' && $guardianPhone !== '') {
            $existingParent = $this->guardianLinkService->findByPhone($guardianPhone, $schoolId);

            $linkData = $existingParent
                ? ['parent_id' => $existingParent->id]
                : ['name' => $guardianName, 'phone' => $guardianPhone];
            // The source data has no father/mother distinction — just a
            // single "Guardian Name" column — so 'guardian' is the only
            // honest relation value here.
            $linkData['relation'] = 'guardian';
            $linkData['is_primary_contact'] = true;

            $this->guardianLinkService->link($student, $linkData, $schoolId);
        }

        $row->update(['resolution' => ImportRowResolution::Accept]);
    }

    /**
     * @param  array<string, mixed>  $decision
     * @param  array<string, mixed>  $proposed
     * @param  array<string, int>  $createdClassesByName
     */
    private function resolveClassId(array $decision, array $proposed, int $schoolId, array &$createdClassesByName): int
    {
        if (! empty($decision['class_id'])) {
            return (int) $decision['class_id'];
        }

        if (! empty($decision['new_class_name'])) {
            $key = strtolower(trim($decision['new_class_name']));

            if (! isset($createdClassesByName[$key])) {
                $newClass = $this->classService->create([
                    'name' => $decision['new_class_name'],
                    'section' => $decision['new_class_section'] ?? null,
                ], $schoolId);
                $createdClassesByName[$key] = $newClass->id;
            }

            return $createdClassesByName[$key];
        }

        if (! empty($proposed['class_id'])) {
            return (int) $proposed['class_id'];
        }

        throw new RuntimeException('No class resolved for this row — map it to an existing class or create a new one.');
    }
}
