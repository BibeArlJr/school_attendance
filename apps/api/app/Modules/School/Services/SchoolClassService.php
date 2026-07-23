<?php

namespace App\Modules\School\Services;

use App\Modules\School\Models\AcademicYear;
use App\Modules\School\Models\SchoolClass;

/**
 * Extracted from ClassController::store() (Phase 4) so the bulk-import
 * commit flow (Phase 9) can create a class exactly the same way a manual
 * "create new class" does, rather than duplicating the academic-year
 * resolution logic. Behavior is unchanged from the original inline code.
 */
class SchoolClassService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, int $schoolId): SchoolClass
    {
        $academicYear = AcademicYear::query()
            ->where('school_id', $schoolId)
            ->where('is_current', true)
            ->firstOrFail();

        return SchoolClass::create([
            ...$data,
            'school_id' => $schoolId,
            'academic_year_id' => $academicYear->id,
        ]);
    }
}
