<?php

namespace App\Modules\Staff\Services;

use App\Modules\Import\Models\ImportBatch;
use App\Modules\Import\Models\ImportBatchRow;
use App\Support\Enums\ImportBatchStatus;
use App\Support\Enums\ImportRowResolution;
use App\Support\Exceptions\ImportBatchAlreadyCommittedException;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use Throwable;

/**
 * Turns a reviewer's per-row accept/skip decisions into real Staff
 * records via StaffService::create() — same idempotent-commit-claim
 * pattern (atomic UPDATE ... WHERE status != committed) as
 * App\Modules\Import\Services\ImportCommitService, reused verbatim,
 * not reimplemented. No class-resolution step at all — staff have no
 * class concept, so this is materially simpler than the student
 * commit service it sits alongside.
 */
class StaffImportCommitService
{
    public function __construct(private readonly StaffService $staffService)
    {
    }

    /**
     * @param  array<int, array<string, mixed>>  $rowDecisions  keyed by ImportBatchRow id
     * @return array{created: int, skipped: int, errors: list<array<string, mixed>>}
     */
    public function commit(ImportBatch $batch, array $rowDecisions, int $schoolId): array
    {
        $claimed = ImportBatch::query()
            ->where('id', $batch->id)
            ->where('status', '!=', ImportBatchStatus::Committed->value)
            ->update(['status' => ImportBatchStatus::Committed]);

        if ($claimed === 0) {
            throw new ImportBatchAlreadyCommittedException(
                'This import has already been committed and cannot be committed again.',
            );
        }

        $created = 0;
        $skipped = 0;
        $errors = [];

        foreach ($batch->rows as $row) {
            $decision = $rowDecisions[$row->id] ?? ['resolution' => 'skip'];

            if (($decision['resolution'] ?? 'skip') !== 'accept') {
                $row->update(['resolution' => ImportRowResolution::Skip]);
                $skipped++;

                continue;
            }

            try {
                DB::transaction(function () use ($row, $decision, $schoolId) {
                    $this->commitRow($row, $decision, $schoolId);
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
            'imported_count' => $created,
            'skipped_count' => $skipped,
        ]);

        return ['created' => $created, 'skipped' => $skipped, 'errors' => $errors];
    }

    /**
     * @param  array<string, mixed>  $decision
     */
    private function commitRow(ImportBatchRow $row, array $decision, int $schoolId): void
    {
        $proposed = $row->proposed_data;

        $name = trim((string) ($decision['name'] ?? $proposed['name'] ?? ''));
        if ($name === '') {
            throw new RuntimeException("Row {$row->row_number} ({$row->sheet_name}): missing staff name.");
        }

        $this->staffService->create([
            'name' => $name,
            'mobile' => $proposed['mobile'] ?? null,
            'dob_bs' => $proposed['dob_bs'] ?? null,
            'address' => $proposed['address'] ?? null,
            'citizenship_number' => $proposed['citizenship_number'] ?? null,
            'designation' => $proposed['designation'] ?? null,
            'rank' => $proposed['rank'] ?? null,
            'sheet_roll_no' => $proposed['sheet_roll_no'] ?? null,
            'level' => $proposed['level'] ?? null,
            'import_batch_id' => $row->import_batch_id,
        ], $schoolId);

        $row->update(['resolution' => ImportRowResolution::Accept]);
    }
}
