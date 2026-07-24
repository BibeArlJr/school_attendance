<?php

namespace App\Modules\Platform\Services;

use App\Models\User;
use App\Modules\Attendance\Models\SchoolConfig;
use App\Modules\School\Models\AcademicYear;
use App\Modules\School\Models\School;
use App\Support\Enums\UserRole;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PlatformSchoolService
{
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
            // could set or change it later.
            $school->school_code = $data['school_code'];
            $school->save();

            $this->seedDefaults($school);

            $temporaryPassword = Str::password(12);

            $admin = User::create([
                'name' => $data['admin_name'],
                'email' => $data['admin_email'],
                'password' => $temporaryPassword,
                'school_id' => $school->id,
                'role' => UserRole::Admin,
                'email_verified_at' => now(),
            ]);

            return ['school' => $school, 'admin' => $admin, 'temporary_password' => $temporaryPassword];
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
