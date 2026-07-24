<?php

namespace App\Modules\Import\Services;

use App\Modules\Import\Models\ImportBatch;
use App\Modules\School\Models\SchoolClass;
use App\Modules\Student\Models\Student;
use App\Support\Enums\ImportBatchStatus;
use App\Support\Services\GradeLevelInference;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;

/**
 * Parses an uploaded student-roster workbook into an ImportBatch +
 * ImportBatchRow rows for review. Nothing here touches students/parents/
 * classes — that only happens in ImportCommitService, after a reviewer
 * has accepted each row. See Prompt 9 SCOPE: preview/review is mandatory
 * before any data is persisted.
 */
class ImportParsingService
{
    public function __construct(private readonly GradeLevelInference $gradeLevelInference)
    {
    }

    /**
     * Normalized header cell (lowercased, periods stripped, whitespace
     * collapsed) -> canonical field name. Built from the real fixture's
     * actual header variants, not a guessed superset — see
     * tests/Fixtures/bindabasini_mavi_barpatan.xls.
     */
    private const HEADER_MAP = [
        'rno' => 'roll_no',           // "R.No."
        'ro no' => 'roll_no',         // "Ro no "
        'roll no' => 'roll_no',       // "Roll. No"
        'name' => 'name',
        'class' => 'class_name',
        'guardian name' => 'guardian_name',
        'g name' => 'guardian_name',  // "G. Name"
        'dob' => 'dob_bs',            // "D.O.B." and "Dob" both normalize here
        'address' => 'address',
        'contact' => 'guardian_phone',
        'phone no' => 'guardian_phone',
        // "Photo No." normalizes to "photo no" — deliberately absent from
        // this map, so it's discarded rather than mapped to anything.
    ];

    private const REQUIRED_FIELDS = ['name', 'class_name', 'dob_bs'];

    /** Max Levenshtein distance for an unresolved class name to still get a suggestion. */
    private const CLASS_FUZZY_THRESHOLD = 2;

    public function parse(UploadedFile $file, int $schoolId, int $uploadedById): ImportBatch
    {
        $spreadsheet = IOFactory::load($file->getRealPath());

        $batch = ImportBatch::create([
            'school_id' => $schoolId,
            'file_name' => $file->getClientOriginalName(),
            'uploaded_by' => $uploadedById,
            'uploaded_at' => now(),
            'status' => ImportBatchStatus::Processing,
        ]);

        // orderBy('id') makes the grade-level match's tie-break
        // deterministic when a grade has multiple sections (e.g. "Grade
        // 1/A" and "Grade 1/B" both share grade_level 1) — the import's
        // source data has no section concept, so picking the
        // first-created section for that grade is the reasonable default.
        $existingClasses = SchoolClass::query()->where('school_id', $schoolId)
            ->orderBy('id')
            ->get(['id', 'name', 'grade_level']);

        /** @var array<string, list<array<string, mixed>>> $seenNames */
        $seenNames = [];
        foreach (Student::query()->where('school_id', $schoolId)->get(['id', 'first_name', 'last_name', 'dob_bs']) as $student) {
            $key = $this->duplicateKey($student->first_name, $student->last_name, $student->dob_bs);
            $seenNames[$key][] = ['type' => 'existing_student', 'student_id' => $student->id];
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

            // mapHeaders() already returns [canonicalField => colIndex] —
            // exactly the shape needed to look up a column by field name
            // below, no flip needed.
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
                [$firstName, $lastName] = $this->splitName($name);

                $rollNo = isset($fieldToColumn['roll_no']) ? trim((string) ($row[$fieldToColumn['roll_no']] ?? '')) : null;
                $rawClassName = trim((string) ($row[$fieldToColumn['class_name']] ?? ''));
                $dobBs = $this->extractDobBs($row[$fieldToColumn['dob_bs']] ?? null);
                $address = isset($fieldToColumn['address']) ? trim((string) ($row[$fieldToColumn['address']] ?? '')) : null;
                $guardianName = isset($fieldToColumn['guardian_name']) ? trim((string) ($row[$fieldToColumn['guardian_name']] ?? '')) : null;
                $guardianPhone = isset($fieldToColumn['guardian_phone']) ? trim((string) ($row[$fieldToColumn['guardian_phone']] ?? '')) : null;

                $flags = [];

                $classMatch = $this->resolveClass($rawClassName, $existingClasses);
                if ($classMatch['class_id'] === null) {
                    $flags[] = 'unrecognized_class';
                }

                $nameKey = $this->duplicateKey($firstName, $lastName, $dobBs);
                $duplicateMatches = $seenNames[$nameKey] ?? [];
                if ($duplicateMatches !== []) {
                    $flags[] = 'possible_duplicate';
                }
                $seenNames[$nameKey][] = ['type' => 'batch_row', 'sheet_name' => $sheetName, 'row_number' => $rowNumber];

                $batch->rows()->create([
                    'row_number' => $rowNumber,
                    'sheet_name' => $sheetName,
                    'raw_data' => $rawData,
                    'proposed_data' => [
                        'roll_no' => $rollNo,
                        'first_name' => $firstName,
                        'last_name' => $lastName,
                        'class_name_raw' => $rawClassName,
                        'class_id' => $classMatch['class_id'],
                        'suggested_class_id' => $classMatch['suggested_class_id'],
                        'suggested_class_name' => $classMatch['suggested_class_name'],
                        'inferred_grade_level' => $classMatch['inferred_grade_level'],
                        'dob_bs' => $dobBs,
                        'address' => $address,
                        'guardian_name' => $guardianName,
                        'guardian_phone' => $guardianPhone,
                        'duplicate_matches' => $duplicateMatches,
                    ],
                    'flags' => $flags,
                    // No row is pre-accepted — see the migration's comment.
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
     * @return array<string, int> canonical field name => column index
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

    private function normalizeName(string $name): string
    {
        return strtolower(trim(preg_replace('/\s+/', ' ', $name)));
    }

    /**
     * Student-identity key for possible_duplicate detection — name AND
     * dob_bs, never guardian data (guardian dedupe is a wholly separate
     * mechanism, ParentGuardianLinkService::findByPhone, applied later in
     * ImportCommitService and never consulted here). Name-only used to be
     * the whole key, which meant two different children who happen to
     * share a common name (frequent in this real dataset — 16 such
     * collisions found among just 400 already-imported students) got
     * flagged as duplicates of each other with no way to tell them apart.
     * Requiring dob_bs to also match narrows the flag back to genuine
     * same-identity matches. A missing dob_bs on either side simply can't
     * produce a match — under-flagging when there isn't enough
     * information beats the previous over-flagging.
     */
    private function duplicateKey(string $firstName, string $lastName, ?string $dobBs): string
    {
        return $this->normalizeName("{$firstName} {$lastName}").'|'.($dobBs ?? '');
    }

    /**
     * @return array{0: string, 1: string} [first_name, last_name]
     */
    private function splitName(string $name): array
    {
        $parts = preg_split('/\s+/', trim($name), 2);
        if ($parts === false || $parts === ['']) {
            return ['', ''];
        }

        return [$parts[0], $parts[1] ?? ''];
    }

    /**
     * Handles the real fixture's two on-disk representations of the same
     * BS date: plain text (sometimes with a leading `'` — Excel's
     * "treat as text" marker) and, for several sheets, a genuine Excel
     * date serial number (the source enterer typed e.g. "2072/1/10" into
     * a date-formatted cell, and Excel silently converted it to a serial
     * day-count). Converting that serial back via the same Gregorian
     * epoch arithmetic recovers the exact digits that were typed — this
     * is not a BS->AD conversion, just reversing Excel's own encoding.
     */
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

    /**
     * Three passes, in order of confidence:
     * 1. Exact string match (case/whitespace-insensitive).
     * 2. Grade-level match — catches semantic equivalents the string
     *    comparison can't (e.g. "One" vs "Grade 1", same grade, unrelated
     *    spelling). A stronger signal than mere spelling similarity, so
     *    it's tried before the fuzzy pass below, and — unlike the fuzzy
     *    pass — resolves the row outright rather than just suggesting.
     * 3. Fuzzy string match — catches typos (e.g. "Tow" -> "Two") that
     *    neither of the above catch. Only ever a suggestion, never an
     *    auto-resolve, since a near-miss string could just as easily be a
     *    genuinely different class.
     *
     * Only if all three fail does the row get flagged unrecognized_class
     * with no usable suggestion at all.
     *
     * @param  Collection<int, SchoolClass>  $existingClasses
     * @return array{class_id: ?int, suggested_class_id: ?int, suggested_class_name: ?string, inferred_grade_level: ?int}
     */
    private function resolveClass(string $rawClassName, Collection $existingClasses): array
    {
        $normalized = $this->normalizeName($rawClassName);

        foreach ($existingClasses as $class) {
            if ($this->normalizeName($class->name) === $normalized) {
                return [
                    'class_id' => $class->id,
                    'suggested_class_id' => null,
                    'suggested_class_name' => null,
                    'inferred_grade_level' => null,
                ];
            }
        }

        $inferredGradeLevel = $this->gradeLevelInference->infer($rawClassName);
        if ($inferredGradeLevel !== null) {
            // Collection::firstWhere() compares with `==`, and in PHP
            // `null == 0` is true — since ECD's grade_level is literally
            // 0, that loose comparison would wrongly match any class
            // whose grade_level is still null. Strict comparison here
            // avoids that collision.
            $gradeMatch = $existingClasses->first(fn (SchoolClass $class) => $class->grade_level === $inferredGradeLevel);
            if ($gradeMatch !== null) {
                return [
                    'class_id' => $gradeMatch->id,
                    'suggested_class_id' => null,
                    'suggested_class_name' => null,
                    'inferred_grade_level' => $inferredGradeLevel,
                ];
            }
        }

        $bestClass = null;
        $bestDistance = null;
        foreach ($existingClasses as $class) {
            $distance = levenshtein($normalized, $this->normalizeName($class->name));
            if ($bestDistance === null || $distance < $bestDistance) {
                $bestDistance = $distance;
                $bestClass = $class;
            }
        }

        if ($bestClass !== null && $bestDistance <= self::CLASS_FUZZY_THRESHOLD) {
            return [
                'class_id' => null,
                'suggested_class_id' => $bestClass->id,
                'suggested_class_name' => $bestClass->name,
                'inferred_grade_level' => $inferredGradeLevel,
            ];
        }

        return [
            'class_id' => null,
            'suggested_class_id' => null,
            'suggested_class_name' => null,
            'inferred_grade_level' => $inferredGradeLevel,
        ];
    }
}
