<?php

namespace App\Modules\Staff\Services;

use App\Modules\Import\Models\ImportBatch;
use App\Modules\Staff\Models\Staff;
use App\Support\Enums\ImportBatchStatus;
use Illuminate\Http\UploadedFile;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;

/**
 * Parses an uploaded staff-roster workbook into an ImportBatch +
 * ImportBatchRow rows for review — same ImportBatch/ImportBatchRow
 * models and parse-then-review-then-commit shape as
 * App\Modules\Import\Services\ImportParsingService (students), reused
 * as-is; this is a sibling, not a generalization of that class, since
 * staff has no class-matching subsystem at all (simpler real column
 * set, confirmed against the actual uploaded file) — forcing one
 * shared implementation would add branching complexity neither side
 * needs.
 */
class StaffImportParsingService
{
    /**
     * Normalized header cell (lowercased, periods stripped, whitespace
     * collapsed) -> canonical field name. "S.N." is deliberately absent
     * — discarded, same as the student parser drops "Photo No.".
     */
    private const HEADER_MAP = [
        'name' => 'name',
        'mobile no' => 'mobile',
        'date of birth' => 'dob_bs',
        'citizenship number' => 'citizenship_number',
        'teacher status' => 'designation',
        'teacher rank' => 'rank',
        'sheet roll no' => 'sheet_roll_no',
        'address' => 'address',
        'level' => 'level',
    ];

    private const REQUIRED_FIELDS = ['name'];

    public function parse(UploadedFile $file, int $schoolId, int $uploadedById): ImportBatch
    {
        $spreadsheet = IOFactory::load($file->getRealPath());

        $batch = ImportBatch::create([
            'school_id' => $schoolId,
            'file_name' => $file->getClientOriginalName(),
            'entity_type' => 'staff',
            'uploaded_by' => $uploadedById,
            'uploaded_at' => now(),
            'status' => ImportBatchStatus::Processing,
        ]);

        // Duplicate detection: citizenship_number is the real unique
        // identifier when present; name+mobile is the fallback for a
        // row missing it (Part H's explicit spec) — never name alone,
        // which collides too easily on a real staff roster.
        /** @var array<string, list<array<string, mixed>>> $seenByCitizenship */
        $seenByCitizenship = [];
        /** @var array<string, list<array<string, mixed>>> $seenByNameMobile */
        $seenByNameMobile = [];
        foreach (Staff::query()->where('school_id', $schoolId)->get(['id', 'name', 'mobile', 'citizenship_number']) as $staff) {
            if ($staff->citizenship_number) {
                $seenByCitizenship[$this->normalizeName($staff->citizenship_number)][] = ['type' => 'existing_staff', 'staff_id' => $staff->id];
            } else {
                $seenByNameMobile[$this->duplicateKey($staff->name, $staff->mobile)][] = ['type' => 'existing_staff', 'staff_id' => $staff->id];
            }
        }

        $totalRows = 0;
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

            if (count(array_intersect(self::REQUIRED_FIELDS, array_keys($columnMap))) < count(self::REQUIRED_FIELDS)) {
                $skippedSheets[] = ['sheet_name' => $sheetName, 'reason' => 'no recognizable header row'];

                continue;
            }

            $fieldToColumn = $columnMap;
            $dataRows = $sheet->rangeToArray("A2:{$highestCol}{$highestRow}", null, true, false);

            foreach ($dataRows as $offset => $row) {
                $rowNumber = $offset + 2;

                $isBlank = collect($row)->every(fn ($value) => $value === null || trim((string) $value) === '');
                if ($isBlank) {
                    continue;
                }

                $totalRows++;

                $rawData = [];
                foreach ($headerRow as $colIndex => $header) {
                    $rawData[trim((string) $header)] = $row[$colIndex] ?? null;
                }

                $name = trim((string) ($row[$fieldToColumn['name']] ?? ''));
                $mobile = isset($fieldToColumn['mobile']) ? trim((string) ($row[$fieldToColumn['mobile']] ?? '')) : null;
                $dobBs = isset($fieldToColumn['dob_bs']) ? $this->extractDobBs($row[$fieldToColumn['dob_bs']] ?? null) : null;
                $citizenshipNumber = isset($fieldToColumn['citizenship_number']) ? trim((string) ($row[$fieldToColumn['citizenship_number']] ?? '')) : null;
                $designation = isset($fieldToColumn['designation']) ? trim((string) ($row[$fieldToColumn['designation']] ?? '')) : null;
                $rank = isset($fieldToColumn['rank']) ? trim((string) ($row[$fieldToColumn['rank']] ?? '')) : null;
                $sheetRollNo = isset($fieldToColumn['sheet_roll_no']) ? trim((string) ($row[$fieldToColumn['sheet_roll_no']] ?? '')) : null;
                $address = isset($fieldToColumn['address']) ? trim((string) ($row[$fieldToColumn['address']] ?? '')) : null;
                $level = isset($fieldToColumn['level']) ? trim((string) ($row[$fieldToColumn['level']] ?? '')) : null;

                $flags = [];

                if ($citizenshipNumber !== null && $citizenshipNumber !== '') {
                    $key = $this->normalizeName($citizenshipNumber);
                    $duplicateMatches = $seenByCitizenship[$key] ?? [];
                    if ($duplicateMatches !== []) {
                        $flags[] = 'possible_duplicate';
                    }
                    $seenByCitizenship[$key][] = ['type' => 'batch_row', 'sheet_name' => $sheetName, 'row_number' => $rowNumber];
                } else {
                    $key = $this->duplicateKey($name, $mobile);
                    $duplicateMatches = $seenByNameMobile[$key] ?? [];
                    if ($duplicateMatches !== []) {
                        $flags[] = 'possible_duplicate';
                    }
                    $seenByNameMobile[$key][] = ['type' => 'batch_row', 'sheet_name' => $sheetName, 'row_number' => $rowNumber];
                    $flags[] = 'no_citizenship_number';
                }

                $batch->rows()->create([
                    'row_number' => $rowNumber,
                    'sheet_name' => $sheetName,
                    'raw_data' => $rawData,
                    'proposed_data' => [
                        'name' => $name,
                        'mobile' => $mobile ?: null,
                        'dob_bs' => $dobBs,
                        'citizenship_number' => $citizenshipNumber ?: null,
                        'designation' => $designation ?: null,
                        'rank' => $rank ?: null,
                        'sheet_roll_no' => $sheetRollNo ?: null,
                        'address' => $address ?: null,
                        'level' => $level ?: null,
                        'duplicate_matches' => $duplicateMatches,
                    ],
                    'flags' => $flags,
                    'resolution' => 'pending',
                ]);
            }
        }

        $batch->update([
            'total_rows' => $totalRows,
            'skipped_sheets' => $skippedSheets,
            'status' => ImportBatchStatus::ReadyForReview,
        ]);

        return $batch->fresh('rows');
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

    private function normalizeName(string $value): string
    {
        return strtolower(trim(preg_replace('/\s+/', ' ', $value)));
    }

    private function duplicateKey(?string $name, ?string $mobile): string
    {
        return $this->normalizeName($name ?? '').'|'.$this->normalizeName($mobile ?? '');
    }

    private function extractDobBs(mixed $rawValue): ?string
    {
        if ($rawValue === null) {
            return null;
        }

        if (is_numeric($rawValue)) {
            try {
                return ExcelDate::excelToDateTimeObject((float) $rawValue)->format('Y-m-d');
            } catch (\Throwable) {
                return (string) $rawValue;
            }
        }

        $value = trim((string) $rawValue);

        return ltrim($value, "'") ?: null;
    }
}
