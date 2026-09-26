<?php

namespace App\Modules\BulkSms\Services;

use App\Modules\BulkSms\Models\BulkSmsContact;
use App\Modules\BulkSms\Models\BulkSmsUpload;
use App\Support\Services\AuditLogger;
use Illuminate\Http\UploadedFile;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Throwable;

/**
 * Deliberately NOT App\Modules\Import\Services\ImportParsingService/
 * ImportCommitService reused or generalized — those are irreducibly
 * school-scoped (import_batches.school_id is NOT NULL) and this module
 * has no school at all. This is a genuinely lighter-weight sibling: no
 * rows table, no batch status workflow. preview() writes nothing to the
 * database at all — every row it returns is computed and handed back in
 * the response, kept only in the browser's memory until confirm() is
 * called with whichever rows the reviewer wants imported.
 */
class BulkSmsUploadService
{
    /**
     * Normalized header cell -> canonical field name, same
     * lowercase/period-stripped/whitespace-collapsed convention as
     * ImportParsingService::normalizeHeader(). 'phone' is the only
     * required column; 'name' is optional.
     */
    private const HEADER_MAP = [
        'name' => 'name',
        'phone' => 'phone',
        'phone number' => 'phone',
        'phone no' => 'phone',
        'mobile' => 'phone',
        'mobile no' => 'phone',
        'mobile number' => 'phone',
        'contact' => 'phone',
        'contact number' => 'phone',
        'contact no' => 'phone',
        // A real single-column contact list's only header — no other
        // synonym above covers a bare "Number".
        'number' => 'phone',
        'cell' => 'phone',
        'cell number' => 'phone',
    ];

    public function __construct(
        private readonly BulkSmsPhoneNormalizer $normalizer,
        private readonly AuditLogger $auditLogger,
    ) {
    }

    /**
     * @return array{total_rows: int, valid_rows: int, invalid_rows: int, duplicate_rows: int, skipped_sheets: list<array<string, string>>, rows: list<array<string, mixed>>}
     */
    public function preview(UploadedFile $file): array
    {
        $spreadsheet = IOFactory::load($file->getRealPath());

        /** @var array<string, int> $seenInFile normalized phone => row_number of first occurrence */
        $seenInFile = [];
        $existingPhones = BulkSmsContact::query()->pluck('phone')->flip();

        $rows = [];
        $skippedSheets = [];

        foreach ($spreadsheet->getAllSheets() as $sheet) {
            $sheetName = $sheet->getTitle();
            $highestRow = $sheet->getHighestRow();
            $highestCol = $sheet->getHighestColumn();

            if ($highestRow < 2) {
                $skippedSheets[] = ['sheet_name' => $sheetName, 'reason' => 'no data rows'];

                continue;
            }

            $headerRow = $sheet->rangeToArray("A1:{$highestCol}1", null, true, false)[0];
            $columnMap = $this->mapHeaders($headerRow);

            if (! isset($columnMap['phone'])) {
                $skippedSheets[] = ['sheet_name' => $sheetName, 'reason' => 'no recognizable Phone column'];

                continue;
            }

            $dataRows = $sheet->rangeToArray("A2:{$highestCol}{$highestRow}", null, true, false);

            foreach ($dataRows as $offset => $row) {
                $rowNumber = $offset + 2;

                $isBlank = collect($row)->every(fn ($value) => $value === null || trim((string) $value) === '');
                if ($isBlank) {
                    continue;
                }

                $name = isset($columnMap['name']) ? trim((string) ($row[$columnMap['name']] ?? '')) : '';
                $phoneRaw = trim((string) ($row[$columnMap['phone']] ?? ''));

                $rows[] = $this->buildPreviewRow($rowNumber, $sheetName, $name ?: null, $phoneRaw, $seenInFile, $existingPhones);
            }
        }

        return [
            'total_rows' => count($rows),
            'valid_rows' => count(array_filter($rows, fn (array $r) => $r['status'] === 'valid')),
            'invalid_rows' => count(array_filter($rows, fn (array $r) => $r['status'] === 'invalid')),
            'duplicate_rows' => count(array_filter($rows, fn (array $r) => $r['status'] === 'duplicate')),
            'skipped_sheets' => $skippedSheets,
            'rows' => $rows,
        ];
    }

    /**
     * @param  array<int, array<string, mixed>>  $rows  each: ['name' => ?string, 'phone' => string (raw)]
     * @return array{upload: BulkSmsUpload, created: int, skipped: int}
     */
    public function confirm(string $fileName, array $rows, ?int $userId): array
    {
        $upload = BulkSmsUpload::create([
            'file_name' => $fileName,
            'uploaded_by' => $userId,
            'uploaded_at' => now(),
            'total_rows' => count($rows),
        ]);

        $created = 0;
        $skipped = 0;
        /** @var array<string, bool> $seenInBatch */
        $seenInBatch = [];

        foreach ($rows as $row) {
            $result = $this->normalizer->normalize((string) ($row['phone'] ?? ''));

            if (! $result['valid']) {
                $skipped++;

                continue;
            }

            $normalized = $result['normalized'];

            // Re-checked fresh here, not trusted from the preview
            // response — a duplicate could have been added (by another
            // upload, or manually) in the time between preview and this
            // confirm request.
            if (isset($seenInBatch[$normalized]) || BulkSmsContact::query()->where('phone', $normalized)->exists()) {
                $skipped++;

                continue;
            }

            try {
                BulkSmsContact::create([
                    'name' => $row['name'] ?? null,
                    'phone' => $normalized,
                    'upload_id' => $upload->id,
                    'created_by' => $userId,
                ]);
                $seenInBatch[$normalized] = true;
                $created++;
            } catch (Throwable) {
                // The unique constraint on `phone` is the real, final
                // guard against a race between the check above and this
                // insert — one bad/racing row must not abort the batch.
                $skipped++;
            }
        }

        $upload->update(['imported_count' => $created, 'skipped_count' => $skipped]);

        $this->auditLogger->log('bulk_sms_upload.confirmed', 'bulk_sms_upload', $upload->id, null, [
            'file_name' => $fileName,
            'imported_count' => $created,
            'skipped_count' => $skipped,
        ]);

        return ['upload' => $upload, 'created' => $created, 'skipped' => $skipped];
    }

    /**
     * @param  array<string, int>  $seenInFile
     * @param  \Illuminate\Support\Collection<string, int>  $existingPhones
     * @return array<string, mixed>
     */
    private function buildPreviewRow(
        int $rowNumber,
        string $sheetName,
        ?string $name,
        string $phoneRaw,
        array &$seenInFile,
        $existingPhones,
    ): array {
        $base = [
            'row_number' => $rowNumber,
            'sheet_name' => $sheetName,
            'name' => $name,
            'phone_raw' => $phoneRaw,
        ];

        $result = $this->normalizer->normalize($phoneRaw);

        if (! $result['valid']) {
            return [...$base, 'phone_normalized' => null, 'status' => 'invalid', 'reason' => $result['reason']];
        }

        $normalized = $result['normalized'];

        if ($existingPhones->has($normalized)) {
            return [
                ...$base,
                'phone_normalized' => $normalized,
                'status' => 'duplicate',
                'reason' => 'Already exists in your contacts.',
            ];
        }

        if (isset($seenInFile[$normalized])) {
            return [
                ...$base,
                'phone_normalized' => $normalized,
                'status' => 'duplicate',
                'reason' => "Duplicate of row {$seenInFile[$normalized]} in this file.",
            ];
        }

        $seenInFile[$normalized] = $rowNumber;

        return [...$base, 'phone_normalized' => $normalized, 'status' => 'valid', 'reason' => null];
    }

    /**
     * @param  list<mixed>  $headerRow
     * @return array<string, int>
     */
    private function mapHeaders(array $headerRow): array
    {
        $map = [];
        foreach ($headerRow as $colIndex => $header) {
            $normalized = $this->normalizeHeader((string) $header);
            if (isset(self::HEADER_MAP[$normalized]) && ! isset($map[self::HEADER_MAP[$normalized]])) {
                $map[self::HEADER_MAP[$normalized]] = $colIndex;
            }
        }

        return $map;
    }

    private function normalizeHeader(string $header): string
    {
        $stripped = str_replace('.', '', $header);

        return strtolower(trim(preg_replace('/\s+/', ' ', $stripped)));
    }
}
