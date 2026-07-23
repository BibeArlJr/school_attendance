<?php

namespace App\Modules\Student\Services;

use App\Modules\IdCard\Services\IdCardService;
use App\Modules\School\Models\AcademicYear;
use App\Modules\Student\Models\Student;
use App\Modules\Student\Models\StudentEnrollment;
use App\Support\Services\SequenceGeneratorService;
use Illuminate\Support\Facades\DB;

class StudentService
{
    public function __construct(
        private readonly SequenceGeneratorService $sequenceGenerator,
        private readonly IdCardService $idCardService,
    ) {
    }

    /**
     * `roll_no`, if present in $data, is not a students-table column — it's
     * pulled out here and threaded through to the enrollment row instead
     * (see enrollForCurrentYear). Only the bulk-import flow (Phase 9)
     * passes it; the manual create form has no roll number field.
     *
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, int $schoolId): Student
    {
        return DB::transaction(function () use ($data, $schoolId) {
            $admissionNo = $this->sequenceGenerator->next($schoolId, 'STUDENT_ADMISSION', 'ADM');
            $rollNo = $data['roll_no'] ?? null;
            unset($data['roll_no']);

            $student = Student::create([
                ...$data,
                'school_id' => $schoolId,
                'admission_no' => $admissionNo,
            ]);

            $this->enrollForCurrentYear($student, $schoolId, $data['class_id'], $rollNo);
            $this->idCardService->generateForStudent($student);

            return $student;
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Student $student, array $data): Student
    {
        return DB::transaction(function () use ($student, $data) {
            $classChanged = (int) $data['class_id'] !== $student->class_id;

            $student->update($data);

            if ($classChanged) {
                $this->enrollForCurrentYear($student, $student->school_id, $data['class_id']);
            }

            return $student->fresh();
        });
    }

    public function updateStatus(Student $student, string $status): Student
    {
        $student->update(['status' => $status]);

        return $student->fresh();
    }

    /**
     * Creates or updates (if a reassignment happens within the same
     * academic year) the single student_enrollments row for the current
     * year — the historical record across years, while students.class_id
     * stays the denormalized "current class" pointer.
     */
    private function enrollForCurrentYear(Student $student, int $schoolId, int $classId, ?string $rollNo = null): void
    {
        $academicYear = AcademicYear::query()
            ->where('school_id', $schoolId)
            ->where('is_current', true)
            ->first();

        if (! $academicYear) {
            return;
        }

        $attributes = ['class_id' => $classId, 'status' => 'active'];
        if ($rollNo !== null) {
            $attributes['roll_no'] = $rollNo;
        }

        StudentEnrollment::updateOrCreate(
            ['student_id' => $student->id, 'academic_year_id' => $academicYear->id],
            $attributes,
        );
    }
}
