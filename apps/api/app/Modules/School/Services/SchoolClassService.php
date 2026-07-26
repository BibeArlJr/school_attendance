<?php

namespace App\Modules\School\Services;

use App\Modules\School\Models\AcademicYear;
use App\Modules\School\Models\SchoolClass;
use App\Modules\Student\Models\Student;
use App\Modules\Student\Models\StudentEnrollment;
use App\Support\Exceptions\DeleteBlockedException;
use App\Support\Services\AuditLogger;
use App\Support\Services\GradeLevelInference;

/**
 * Extracted from ClassController::store() (Phase 4) so the bulk-import
 * commit flow (Phase 9) can create a class exactly the same way a manual
 * "create new class" does, rather than duplicating the academic-year
 * resolution logic. Behavior is unchanged from the original inline code
 * beyond the grade_level inference added here.
 */
class SchoolClassService
{
    public function __construct(
        private readonly GradeLevelInference $gradeLevelInference,
        private readonly AuditLogger $auditLogger,
    ) {
    }

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
            'grade_level' => $this->gradeLevelInference->infer($data['name'] ?? ''),
        ]);
    }

    /**
     * A class that was ever actually used — currently holding a student,
     * or referenced by any historical enrollment row — stays permanently,
     * to protect historical reports. Only a truly never-used class
     * (created by mistake, or a grade never actually populated) can be
     * deleted.
     */
    public function destroy(SchoolClass $class): void
    {
        $hasCurrentStudents = Student::query()->where('class_id', $class->id)->exists();
        $hasHistoricalEnrollments = StudentEnrollment::query()->where('class_id', $class->id)->exists();

        if ($hasCurrentStudents || $hasHistoricalEnrollments) {
            throw new DeleteBlockedException(
                'Cannot delete: this class has students (current or historical) assigned to it.',
            );
        }

        $before = $class->toArray();
        $class->delete();

        $this->auditLogger->log('class.deleted', 'class', $class->id, $before, null, $class->school_id);
    }
}
