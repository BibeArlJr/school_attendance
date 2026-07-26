<?php

namespace Tests\Support;

use App\Models\User;
use App\Modules\Attendance\Models\GateDevice;
use App\Modules\Attendance\Models\SchoolCalendar;
use App\Modules\Attendance\Models\SchoolConfig;
use App\Modules\IdCard\Models\IdCard;
use App\Modules\ParentGuardian\Models\ParentGuardian;
use App\Modules\ParentGuardian\Models\StudentParentLink;
use App\Modules\School\Models\AcademicYear;
use App\Modules\School\Models\School;
use App\Modules\School\Models\SchoolClass;
use App\Modules\Staff\Models\Staff;
use App\Modules\Student\Models\Student;
use App\Support\Enums\CalendarDayType;
use App\Support\Enums\GuardianRelation;
use App\Support\Enums\IdCardStatus;
use App\Support\Enums\StaffEmploymentStatus;
use App\Support\Enums\StudentStatus;
use App\Support\Enums\UserRole;
use Illuminate\Support\Str;

/**
 * Minimal, valid entity graphs for feature tests (Prompt 46). Raw Eloquent
 * creates, not the service layer (StudentService/IdCardService/etc.) —
 * those add side effects (barcode generation, audit logging) this trait's
 * callers don't need by default; tests that specifically exercise those
 * services call them directly instead.
 *
 * No Laravel model factories (Database\Factories\*Factory) were added for
 * these 12 models — only User already had one. Adding factory classes
 * for every tenant-scoped model would be more production-file surface
 * area than this test suite needs; these plain helper methods cover the
 * same ground for the three suites this prompt asks for.
 */
trait CreatesTestData
{
    protected function makeSchool(array $overrides = []): School
    {
        $school = new School([
            'name' => $overrides['name'] ?? 'Test School '.Str::random(6),
            'slug' => $overrides['slug'] ?? 'test-school-'.Str::random(8),
            'contact_email' => $overrides['contact_email'] ?? null,
            'contact_phone' => $overrides['contact_phone'] ?? null,
            'amc_expiry_date' => $overrides['amc_expiry_date'] ?? null,
        ]);
        $school->school_code = $overrides['school_code'] ?? 'SCH-'.Str::random(6);
        $school->save();

        if (array_key_exists('is_active', $overrides) && ! $overrides['is_active']) {
            $school->deactivate();
        }

        return $school->fresh();
    }

    protected function makeUser(?School $school, UserRole $role, array $overrides = []): User
    {
        return User::forceCreate([
            'name' => $overrides['name'] ?? ucfirst($role->value).' '.Str::random(6),
            'email' => $overrides['email'] ?? Str::random(12).'@test.example',
            'password' => 'Test@Passw0rd',
            'phone' => $overrides['phone'] ?? null,
            'role' => $role,
            'school_id' => $school?->id,
            'active_school_id' => $overrides['active_school_id'] ?? null,
            'is_active' => $overrides['is_active'] ?? true,
            'email_verified_at' => now(),
        ]);
    }

    protected function makeSuperAdmin(array $overrides = []): User
    {
        return $this->makeUser(null, UserRole::SuperAdmin, $overrides);
    }

    protected function makeAcademicYear(School $school, array $overrides = []): AcademicYear
    {
        return AcademicYear::forceCreate([
            'school_id' => $school->id,
            'label' => $overrides['label'] ?? '2026-2027',
            'start_date' => $overrides['start_date'] ?? '2026-04-14',
            'end_date' => $overrides['end_date'] ?? '2027-04-13',
            'is_current' => $overrides['is_current'] ?? true,
        ]);
    }

    protected function makeClass(School $school, ?AcademicYear $year = null, array $overrides = []): SchoolClass
    {
        $year ??= $this->makeAcademicYear($school);

        return SchoolClass::forceCreate([
            'school_id' => $school->id,
            'academic_year_id' => $year->id,
            'name' => $overrides['name'] ?? 'Grade 5',
            'section' => $overrides['section'] ?? 'A',
            'class_teacher_name' => $overrides['class_teacher_name'] ?? null,
            'grade_level' => $overrides['grade_level'] ?? 5,
        ]);
    }

    protected function makeStudent(School $school, ?SchoolClass $class = null, array $overrides = []): Student
    {
        $class ??= $this->makeClass($school);

        return Student::forceCreate([
            'school_id' => $school->id,
            'class_id' => $class->id,
            'first_name' => $overrides['first_name'] ?? 'Test',
            'last_name' => $overrides['last_name'] ?? 'Student',
            'dob' => $overrides['dob'] ?? '2015-01-01',
            'gender' => $overrides['gender'] ?? 'male',
            'status' => $overrides['status'] ?? StudentStatus::Active,
            'admission_date' => $overrides['admission_date'] ?? '2026-04-14',
        ]);
    }

    protected function makeStaff(School $school, ?User $user = null, array $overrides = []): Staff
    {
        $user ??= $this->makeUser($school, UserRole::Guard);

        return Staff::forceCreate([
            'school_id' => $school->id,
            'user_id' => $user->id,
            'designation' => $overrides['designation'] ?? null,
            'employment_status' => $overrides['employment_status'] ?? StaffEmploymentStatus::Active,
        ]);
    }

    protected function makeParentGuardian(School $school, array $overrides = []): ParentGuardian
    {
        return ParentGuardian::forceCreate([
            'school_id' => $school->id,
            'name' => $overrides['name'] ?? 'Test Parent',
            'phone' => $overrides['phone'] ?? '9800000000',
            'email' => $overrides['email'] ?? null,
        ]);
    }

    protected function linkParent(Student $student, ParentGuardian $parent, bool $isPrimary = true, array $overrides = []): StudentParentLink
    {
        return StudentParentLink::forceCreate([
            'student_id' => $student->id,
            'parent_id' => $parent->id,
            'relation' => $overrides['relation'] ?? GuardianRelation::Father,
            'is_primary_contact' => $isPrimary,
        ]);
    }

    protected function makeIdCard(
        School $school,
        Student|Staff $owner,
        string $ownerType = 'student',
        ?string $barcode = null,
        IdCardStatus $status = IdCardStatus::Active,
    ): IdCard {
        return IdCard::forceCreate([
            'school_id' => $school->id,
            'owner_type' => $ownerType,
            'owner_id' => $owner->id,
            'barcode_value' => $barcode ?? 'BC-'.Str::random(12),
            'status' => $status,
            'issued_date' => now()->toDateString(),
        ]);
    }

    protected function makeSchoolConfig(School $school, array $overrides = []): SchoolConfig
    {
        return SchoolConfig::query()->updateOrCreate(
            ['school_id' => $school->id],
            [
                'start_time' => $overrides['start_time'] ?? '08:00:00',
                'end_time' => $overrides['end_time'] ?? '15:30:00',
                'late_threshold_minutes' => $overrides['late_threshold_minutes'] ?? 15,
                'early_departure_threshold_minutes' => $overrides['early_departure_threshold_minutes'] ?? 30,
                'duplicate_scan_window_seconds' => $overrides['duplicate_scan_window_seconds'] ?? 30,
                'working_days' => $overrides['working_days'] ?? [0, 1, 2, 3, 4, 5],
            ],
        );
    }

    protected function makeSchoolCalendar(School $school, string $date, CalendarDayType $dayType, array $overrides = []): SchoolCalendar
    {
        return SchoolCalendar::forceCreate([
            'school_id' => $school->id,
            'date' => $date,
            'day_type' => $dayType,
            'label' => $overrides['label'] ?? null,
            'half_day_end_time' => $overrides['half_day_end_time'] ?? null,
        ]);
    }

    protected function makeGateDevice(School $school, array $overrides = []): GateDevice
    {
        return GateDevice::forceCreate([
            'school_id' => $school->id,
            'name' => $overrides['name'] ?? 'Main Gate',
            'location_note' => $overrides['location_note'] ?? null,
        ]);
    }
}
