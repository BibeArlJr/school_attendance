<?php

namespace App\Modules\Platform\Services;

use App\Models\User;
use App\Modules\Attendance\Models\SchoolConfig;
use App\Modules\School\Models\AcademicYear;
use App\Modules\School\Models\School;
use App\Modules\Staff\Models\Staff;
use App\Modules\Student\Models\Student;
use App\Support\Concerns\BelongsToSchool;
use App\Support\Enums\UserRole;
use App\Support\Exceptions\DeleteBlockedException;
use App\Support\Services\AuditLogger;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PlatformSchoolService
{
    public function __construct(private readonly AuditLogger $auditLogger)
    {
    }

    /**
     * Creates the school and its first admin login (role=admin — this
     * codebase has no separate "school_admin" enum case; `admin` already
     * is the school-scoped administrator role, distinct from the
     * platform-level `super_admin`) in one transaction. The generated
     * password is returned once, in plain text — same one-time-reveal
     * pattern as StaffService::create() (Prompt 8), not reinvented here.
     *
     * @param  array<string, mixed>  $data
     * @return array{school: School, admin: User, temporary_password: string}
     */
    public function create(array $data): array
    {
        return DB::transaction(function () use ($data) {
            $school = new School([
                'name' => $data['name'],
                'slug' => $this->uniqueSlug($data['name']),
                'contact_email' => $data['contact_email'] ?? null,
                'contact_phone' => $data['contact_phone'] ?? null,
            ]);
            // school_code is deliberately never mass-assignable (not in
            // School::$fillable) — set directly here, the one place a
            // school is ever created, so there is no other path that
            // could set or change it later. Normalized to uppercase here
            // too, independently of StorePlatformSchoolRequest's own
            // prepareForValidation() — defense in depth, same reasoning
            // as everywhere else in this app (e.g. AttendanceService
            // normalizing barcode input): this service method must be
            // correct on its own, not merely lucky because its one
            // current caller already normalized upstream.
            $school->school_code = mb_strtoupper(trim($data['school_code']));
            $school->save();

            $this->seedDefaults($school);

            $temporaryPassword = Str::password(12);

            $admin = User::create([
                'name' => $data['admin_name'],
                'email' => $data['admin_email'],
                'phone' => $data['admin_phone'] ?? null,
                'password' => $temporaryPassword,
                'school_id' => $school->id,
                'role' => UserRole::Admin,
                'email_verified_at' => now(),
            ]);

            // Real bug found in production: this method predates Staff
            // Management (Prompt 8) and never created a matching `staff`
            // row for the admin it creates — StaffController::index()
            // queries the `staff` table directly, so every school's
            // original platform-console-created admin was a real,
            // logged-in-capable account that silently never appeared in
            // its own Staff Management list. Same shape as
            // StaffService::create()'s own Staff::create() call.
            Staff::create([
                'school_id' => $school->id,
                'user_id' => $admin->id,
                'designation' => null,
                'employment_status' => 'active',
            ]);

            $this->auditLogger->log(
                'school.created',
                'school',
                $school->id,
                null,
                ['name' => $school->name, 'school_code' => $school->school_code, 'admin_email' => $admin->email],
                $school->id,
            );

            return ['school' => $school, 'admin' => $admin, 'temporary_password' => $temporaryPassword];
        });
    }

    /**
     * Real delete, not a status change — for undoing a mistaken creation
     * (wrong name, typo'd school_code caught too late, a duplicate),
     * never for removing an active school's real data. Two gates, both
     * required, checked in this order:
     *
     * 1. The school must already be deactivated — a deliberate two-step
     *    confirmation (deactivate, THEN delete) rather than one action
     *    that both suspends and destroys at once.
     * 2. Zero real students or staff on record — checked directly
     *    against the Student/Staff tables, NOT the `staff_count` figure
     *    PlatformSchoolController::index() returns for display (that
     *    counts every User row with role admin/teacher/guard, which
     *    always includes the one admin account auto-created at creation
     *    time — using that here would make every school permanently
     *    undeletable from the moment it's created, even one created by
     *    pure accident seconds ago).
     *
     * If both gates pass, the school row is deleted and every table with
     * a real FK to schools.id cascades at the database level (verified
     * cascadeOnDelete() on all of them: students, classes, academic_years,
     * id_cards, attendance_records/events, import_batches, sms_logs/
     * templates/provider_configs, school_configs/calendars,
     * sequence_counters, parent_guardians) — except `users.school_id`,
     * which is deliberately nullOnDelete at the DB level (so deleting
     * some OTHER school can never touch a super_admin's own account by
     * accident) and so is handled explicitly here instead, and
     * `audit_logs`, which has no FK to schools at all by design (Prompt
     * 43 — an audit trail must survive the entity it describes).
     */
    public function destroy(School $school): void
    {
        if ($school->is_active) {
            throw new DeleteBlockedException('Deactivate this school before deleting it.');
        }

        $hasStudents = Student::withoutGlobalScope(BelongsToSchool::class)
            ->where('school_id', $school->id)
            ->exists();
        $hasStaff = Staff::withoutGlobalScope(BelongsToSchool::class)
            ->where('school_id', $school->id)
            ->exists();

        if ($hasStudents || $hasStaff) {
            throw new DeleteBlockedException(
                'Cannot delete: this school has real students or staff on record. Deletion is only for undoing a mistaken creation, not removing an active school.',
            );
        }

        DB::transaction(function () use ($school) {
            $before = $school->toArray();

            User::query()->where('school_id', $school->id)->delete();
            $school->delete();

            $this->auditLogger->log('school.deleted', 'school', $school->id, $before, null, $school->id);
        });
    }

    /**
     * A school with no school_configs row 404s (ModelNotFoundException)
     * on Settings > Attendance Rules AND breaks the gate scanner entirely
     * — AttendanceService::processScan() and AttendanceAnalyticsService
     * both findOrFail(SchoolConfig) unconditionally. Prompt 24's
     * create() never seeded one; this is the fix (Prompt 25 Part A),
     * also used standalone to backfill the school that already exists
     * without it. Defaults match exactly what DemoSeeder set up for the
     * original school. school_calendars is deliberately left empty — no
     * default holidays to assume for a school we know nothing about yet.
     */
    public function seedDefaults(School $school): void
    {
        SchoolConfig::query()->firstOrCreate(
            ['school_id' => $school->id],
            [
                'start_time' => '08:00:00',
                'end_time' => '15:30:00',
                'late_threshold_minutes' => 15,
                'early_departure_threshold_minutes' => 30,
                'duplicate_scan_window_seconds' => 30,
                'working_days' => [0, 1, 2, 3, 4, 5],
            ],
        );

        if (! AcademicYear::query()->where('school_id', $school->id)->where('is_current', true)->exists()) {
            [$start, $end, $label] = $this->currentAcademicYearBounds();

            AcademicYear::query()->create([
                'school_id' => $school->id,
                'label' => $label,
                'start_date' => $start->toDateString(),
                'end_date' => $end->toDateString(),
                'is_current' => true,
            ]);
        }
    }

    /**
     * Nepal's academic year conventionally starts ~Baisakh 1 (BS), which
     * falls on April 13 or 14 (AD) most years — matching the fixed
     * 04-14/04-13 boundary DemoSeeder already hardcoded for the original
     * school, just computed relative to today instead of hardcoded to
     * one specific year.
     *
     * @return array{0: Carbon, 1: Carbon, 2: string}
     */
    private function currentAcademicYearBounds(): array
    {
        $now = Carbon::now();
        $year = $now->year;

        if ($now->lt(Carbon::create($year, 4, 14))) {
            $year--;
        }

        $start = Carbon::create($year, 4, 14);
        $end = Carbon::create($year + 1, 4, 13);

        return [$start, $end, "{$year}-" . ($year + 1)];
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $suffix = 1;

        while (School::query()->where('slug', $slug)->exists()) {
            $suffix++;
            $slug = "{$base}-{$suffix}";
        }

        return $slug;
    }
}
