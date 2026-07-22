<?php

namespace App\Modules\ParentGuardian\Services;

use App\Modules\ParentGuardian\Models\ParentGuardian;
use App\Modules\ParentGuardian\Models\StudentParentLink;
use App\Modules\Student\Models\Student;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ParentGuardianLinkService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function link(Student $student, array $data, int $schoolId): StudentParentLink
    {
        return DB::transaction(function () use ($student, $data, $schoolId) {
            $parent = isset($data['parent_id'])
                ? ParentGuardian::query()->where('school_id', $schoolId)->findOrFail($data['parent_id'])
                : ParentGuardian::create([
                    'school_id' => $schoolId,
                    'name' => $data['name'],
                    'phone' => $data['phone'],
                    'email' => $data['email'] ?? null,
                ]);

            if (
                StudentParentLink::query()
                    ->where('student_id', $student->id)
                    ->where('parent_id', $parent->id)
                    ->exists()
            ) {
                throw ValidationException::withMessages([
                    'parent_id' => ['This parent is already linked to this student.'],
                ]);
            }

            // Application-level enforcement backing up the partial unique
            // index: unset any existing primary for this student first, in
            // the same transaction as the insert, rather than relying on
            // the index alone to surface a clean error.
            if ($data['is_primary_contact']) {
                StudentParentLink::query()
                    ->where('student_id', $student->id)
                    ->where('is_primary_contact', true)
                    ->update(['is_primary_contact' => false]);
            }

            return StudentParentLink::create([
                'student_id' => $student->id,
                'parent_id' => $parent->id,
                'relation' => $data['relation'],
                'is_primary_contact' => $data['is_primary_contact'],
            ]);
        });
    }

    public function unlink(Student $student, ParentGuardian $parent): void
    {
        StudentParentLink::query()
            ->where('student_id', $student->id)
            ->where('parent_id', $parent->id)
            ->delete();
    }
}
