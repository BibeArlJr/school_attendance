<?php

namespace Tests\Feature\Import;

use App\Modules\Import\Models\ImportBatch;
use App\Modules\Import\Models\ImportBatchRow;
use App\Modules\Import\Services\ImportCommitService;
use App\Modules\Student\Models\Student;
use App\Support\Enums\ImportBatchStatus;
use App\Support\Enums\ImportRowResolution;
use App\Support\Exceptions\ImportBatchAlreadyCommittedException;
use Tests\Support\CreatesTestData;
use Tests\TestCase;

/**
 * Regression coverage for the double-submit fix (production duplicate
 * students bug) — a second commit() call on an already-committed batch
 * must be rejected outright, not silently re-process rows and create
 * duplicate students. The real concurrency-race case (two genuinely
 * simultaneous HTTP requests) was verified manually against a live
 * `php artisan serve` instance with two parallel curl processes — not
 * reproducible inside a single PHPUnit process/connection — but the
 * atomic claim this exercises (`UPDATE ... WHERE status != committed`)
 * is exactly what makes that case safe too.
 */
class ImportCommitIdempotencyTest extends TestCase
{
    use CreatesTestData;

    public function test_committing_an_already_committed_batch_is_rejected_and_creates_no_duplicate(): void
    {
        $school = $this->makeSchool();
        $this->makeSchoolConfig($school);
        $admin = $this->makeUser($school, \App\Support\Enums\UserRole::Admin);
        $class = $this->makeClass($school);

        $batch = ImportBatch::create([
            'school_id' => $school->id,
            'file_name' => 'roster.xlsx',
            'uploaded_by' => $admin->id,
            'uploaded_at' => now(),
            'total_rows' => 1,
            'status' => ImportBatchStatus::ReadyForReview,
        ]);

        $row = ImportBatchRow::create([
            'import_batch_id' => $batch->id,
            'row_number' => 1,
            'sheet_name' => 'Sheet1',
            'raw_data' => ['Name' => 'Idempotency Test'],
            'proposed_data' => [
                'first_name' => 'Idempotency',
                'last_name' => 'Test',
                'class_id' => $class->id,
                'class_name_raw' => $class->name,
            ],
            'resolution' => ImportRowResolution::Pending,
        ]);

        $decisions = [$row->id => ['resolution' => 'accept']];
        $service = app(ImportCommitService::class);

        $firstResult = $service->commit($batch, $decisions, $school->id);

        $this->assertSame(1, $firstResult['created']);
        $this->assertSame(
            1,
            Student::where('first_name', 'Idempotency')->where('last_name', 'Test')->count(),
        );

        $this->expectException(ImportBatchAlreadyCommittedException::class);

        try {
            $service->commit($batch, $decisions, $school->id);
        } finally {
            // Assert even though the exception propagates — no duplicate
            // was created by the second, rejected attempt.
            $this->assertSame(
                1,
                Student::where('first_name', 'Idempotency')->where('last_name', 'Test')->count(),
            );
        }
    }
}
