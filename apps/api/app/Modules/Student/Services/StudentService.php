<?php

namespace App\Modules\Student\Services;

use App\Modules\Attendance\Models\AttendanceRecord;
use App\Modules\IdCard\Models\IdCard;
use App\Modules\IdCard\Services\IdCardService;
use App\Modules\ParentGuardian\Models\StudentParentLink;
use App\Modules\School\Models\AcademicYear;
use App\Modules\Student\Models\Student;
use App\Modules\Student\Models\StudentEnrollment;
use App\Support\Exceptions\DeleteBlockedException;
use App\Support\Services\AuditLogger;
use Illuminate\Support\Facades\DB;

class StudentService
{
    public function __construct(
        private readonly IdCardService $idCardService,
        private readonly AuditLogger $auditLogger,
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
            $rollNo = $data['roll_no'] ?? null;
            unset($data['roll_no']);

            $student = Student::create([
                ...$data,
                'school_id' => $schoolId,
            ]);

            $this->enrollForCurrentYear($student, $schoolId, $data['class_id'], $rollNo);
            $this->idCardService->generateForStudent($student);

            return $student;
        });
    }

    /**
     * `roll_no`, same as create() above, is pulled out and threaded to the
     * enrollment row rather than the student itself. Unlike create(),
     * enrollForCurrentYear() runs unconditionally here (Prompt 47) — not
     * just when class_id changed — since that was the reason an edited
     * roll_no was previously silently dropped whenever the class stayed
     * the same. updateOrCreate() there makes this a no-op write when
     * nothing actually changed.
     *
     * @param  array<string, mixed>  $data
     */
    public function update(Student $student, array $data): Student
    {
        return DB::transaction(function () use ($student, $data) {
            $rollNo = $data['roll_no'] ?? null;
            unset($data['roll_no']);

            $student->update($data);

            $this->enrollForCurrentYear($student, $student->school_id, (int) $data['class_id'], $rollNo, overwriteRollNo: true);

            return $student->fresh();
        });
    }

    public function updateStatus(Student $student, string $status): Student
    {
        $student->update(['status' => $status]);

        return $student->fresh();
    }

    /**
     * Real delete, not a status change — only allowed when the student
     * has zero attendance history. The linked parent_guardian is
     * deliberately never touched here: it's an independent record that
     * may still have other children linked to it.
     */
    public function destroy(Student $student): void
    {
        $hasAttendance = AttendanceRecord::query()
            ->where('owner_type', 'student')
            ->where('owner_id', $student->id)
            ->exists();

        if ($hasAttendance) {
            throw new DeleteBlockedException(
                'Cannot delete: this student has attendance history. Use the status menu instead.',
            );
        }

        DB::transaction(function () use ($student) {
            IdCard::query()->where('owner_type', 'student')->where('owner_id', $student->id)->delete();
            StudentEnrollment::query()->where('student_id', $student->id)->delete();
            StudentParentLink::query()->where('student_id', $student->id)->delete();
            $before = $student->toArray();
            $student->delete();

            // Inside the same transaction as the delete itself — either
            // both commit or neither does, so a failed audit write can
            // never silently leave an unlogged delete on record.
            $this->auditLogger->log('student.deleted', 'student', $student->id, $before, null, $student->school_id);
        });
    }

    /**
     * Creates or updates (if a reassignment happens within the same
     * academic year) the single student_enrollments row for the current
     * year — the historical record across years, while students.class_id
     * stays the denormalized "current class" pointer.
     *
     * `$rollNo === null` is ambiguous between two different callers'
     * intents, so `$overwriteRollNo` disambiguates: create() (Phase 9's
     * bulk import is the only caller that ever passes a roll number
     * there) means "null = nothing to set, leave the column's own
     * default"; update()'s Edit form (Prompt 47) always sends a definite
     * value, including an explicit null when the user clears the field —
     * there, null must actually overwrite down to null, not be silently
     * ignored.
     */
    private function enrollForCurrentYear(
        Student $student,
        int $schoolId,
        int $classId,
        ?string $rollNo = null,
        bool $overwriteRollNo = false,
    ): void {
        $academicYear = AcademicYear::query()
            ->where('school_id', $schoolId)
            ->where('is_current', true)
            ->first();

        if (! $academicYear) {
            return;
        }

        $attributes = ['class_id' => $classId, 'status' => 'active'];
        if ($rollNo !== null || $overwriteRollNo) {
            $attributes['roll_no'] = $rollNo;
        }

        StudentEnrollment::updateOrCreate(
            ['student_id' => $student->id, 'academic_year_id' => $academicYear->id],
            $attributes,
        );
    }
}
