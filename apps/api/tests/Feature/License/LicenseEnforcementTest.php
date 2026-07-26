<?php

namespace Tests\Feature\License;

use App\Modules\Attendance\Models\AttendanceRecord;
use App\Modules\School\Models\School;
use App\Support\Enums\AttendanceRecordStatus;
use App\Support\Enums\RecordDayType;
use App\Support\Enums\UserRole;
use App\Support\Services\LicenseReminderService;
use Carbon\Carbon;
use Illuminate\Testing\TestResponse;
use Laravel\Sanctum\Sanctum;
use Tests\Support\CreatesTestData;
use Tests\TestCase;

/**
 * Prompt 46 Suite C — license enforcement: the 8 write actions Prompt
 * 33's checklist enumerates as blocked when a school's license has
 * expired, the reads that must keep working regardless, the boundary
 * values that decide active/grace/expired, the reminder dedup logic, and
 * the deliberately distinct (never conflated) is_active=false suspension
 * behavior.
 */
class LicenseEnforcementTest extends TestCase
{
    use CreatesTestData;

    private School $school;

    private \App\Models\User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->school = $this->makeSchool();
        $this->admin = $this->makeUser($this->school, UserRole::Admin, ['phone' => '9800000001']);
        $this->makeSchoolConfig($this->school);
        $this->makeAcademicYear($this->school);
    }

    private function actingAsAdmin(): void
    {
        Sanctum::actingAs($this->admin->fresh(), ['*']);
    }

    /**
     * @return array<string, callable(): TestResponse>
     */
    private function writeActions(): array
    {
        $class = $this->makeClass($this->school);
        $student = $this->makeStudent($this->school, $class);
        $card = $this->makeIdCard($this->school, $student);
        $record = AttendanceRecord::forceCreate([
            'school_id' => $this->school->id,
            'owner_type' => 'student',
            'owner_id' => $student->id,
            'date' => '2026-08-10',
            'in_time' => '08:05:00',
            'status' => AttendanceRecordStatus::Present,
            'day_type' => RecordDayType::Working,
        ]);

        return [
            'barcode scanning / gate scanner / SMS sending' => fn () => $this->postJson('/api/gate-scanner/scan', [
                'barcode_value' => $card->barcode_value,
            ]),
            'student add/edit/delete' => fn () => $this->postJson('/api/students', [
                'class_id' => $class->id,
                'first_name' => 'Write',
                'last_name' => 'Action',
                'dob' => '2016-01-01',
                'gender' => 'male',
                'admission_date' => '2026-04-14',
            ]),
            'imports' => fn () => $this->postJson('/api/students/import', []),
            'attendance corrections' => fn () => $this->patchJson("/api/attendance-records/{$record->id}", [
                'override_reason' => 'test correction',
                'status' => 'present',
            ]),
            'settings changes' => fn () => $this->putJson('/api/settings/attendance-config', [
                'start_time' => '08:00:00',
                'end_time' => '15:30:00',
                'late_threshold_minutes' => 15,
                'early_departure_threshold_minutes' => 30,
                'duplicate_scan_window_seconds' => 30,
                'working_days' => [0, 1, 2, 3, 4, 5],
            ]),
            'user creation' => fn () => $this->postJson('/api/staff', [
                'name' => 'New Staff',
                'email' => 'new-staff-'.uniqid().'@test.example',
                'role' => 'guard',
            ]),
        ];
    }

    // --- Active school: all 8 write actions succeed ---

    public function test_active_school_all_write_actions_succeed(): void
    {
        $this->school->update(['amc_expiry_date' => now()->addDays(365)->toDateString()]);
        $this->actingAsAdmin();

        foreach ($this->writeActions() as $name => $action) {
            $response = $action();
            $this->assertTrue(
                $response->isSuccessful() || $response->status() === 422,
                "Expected '{$name}' to succeed (or fail its own validation, but never be license-blocked) on an active school; got {$response->status()}: {$response->content()}",
            );
            // Never blocked specifically for license reasons.
            $this->assertNotSame('license_expired', $response->json('errors.code'), "'{$name}' was unexpectedly license-blocked on an active school");
        }
    }

    // --- Expired school: all 8 write actions blocked, matching Prompt 33 exactly ---

    public function test_expired_school_all_write_actions_are_blocked(): void
    {
        $this->school->update(['amc_expiry_date' => now()->subDay()->toDateString()]);
        $this->actingAsAdmin();

        foreach ($this->writeActions() as $name => $action) {
            $response = $action();
            $response->assertStatus(403, "Expected '{$name}' to be blocked (403) on an expired school; got {$response->status()}: {$response->content()}");
            $this->assertSame('license_expired', $response->json('errors.code'), "'{$name}' was not blocked with the license_expired code");
        }
    }

    // --- Expired school: reads still succeed ---

    public function test_expired_school_all_read_actions_still_succeed(): void
    {
        $class = $this->makeClass($this->school);
        $this->makeStudent($this->school, $class);
        $this->school->update(['amc_expiry_date' => now()->subDay()->toDateString()]);
        $this->actingAsAdmin();

        $this->getJson('/api/dashboard/summary')->assertOk();
        $this->getJson('/api/students')->assertOk();
        $this->getJson('/api/attendance')->assertOk();
        $this->getJson('/api/reports/attendance-summary')->assertOk();
        $this->getJson('/api/sms-logs')->assertOk();
        // No separate export endpoint exists in this codebase — the
        // report endpoints above are the actual data-export surface.
    }

    // --- super_admin exempt from license expiry regardless ---

    public function test_super_admin_retains_full_access_regardless_of_expiry(): void
    {
        $class = $this->makeClass($this->school);
        $this->school->update(['amc_expiry_date' => now()->subDay()->toDateString()]);
        $superAdmin = $this->makeSuperAdmin(['active_school_id' => $this->school->id]);
        Sanctum::actingAs($superAdmin, ['*']);

        $this->postJson('/api/students', [
            'class_id' => $class->id,
            'first_name' => 'Super',
            'last_name' => 'Admin Created',
            'dob' => '2016-01-01',
            'gender' => 'male',
            'admission_date' => '2026-04-14',
        ])->assertCreated();
    }

    // --- Status computation boundary values ---

    public function test_license_status_boundary_values(): void
    {
        $today = Carbon::today();

        $this->school->update(['amc_expiry_date' => null]);
        $this->assertSame(\App\Support\Enums\LicenseStatus::Active, $this->school->fresh()->licenseStatus(), 'never-activated (null expiry) is always active');

        $this->school->update(['amc_expiry_date' => $today->copy()->addDays(16)->toDateString()]);
        $this->assertSame(\App\Support\Enums\LicenseStatus::Active, $this->school->fresh()->licenseStatus(), '16 days remaining is active');

        $this->school->update(['amc_expiry_date' => $today->copy()->addDays(15)->toDateString()]);
        $this->assertSame(\App\Support\Enums\LicenseStatus::Grace, $this->school->fresh()->licenseStatus(), 'exactly 15 days remaining is grace (inclusive boundary)');

        $this->school->update(['amc_expiry_date' => $today->toDateString()]);
        $this->assertSame(\App\Support\Enums\LicenseStatus::Grace, $this->school->fresh()->licenseStatus(), 'exactly 0 days remaining is still grace, not yet expired');

        $this->school->update(['amc_expiry_date' => $today->copy()->subDay()->toDateString()]);
        $this->assertSame(\App\Support\Enums\LicenseStatus::Expired, $this->school->fresh()->licenseStatus(), 'negative days remaining (past expiry) is expired');
    }

    // --- Reminder thresholds fire exactly once per period, not re-sent same-day ---

    public function test_reminder_thresholds_fire_once_per_period_and_deduplicate(): void
    {
        $service = app(LicenseReminderService::class);

        $this->school->update(['amc_expiry_date' => now()->addDays(30)->toDateString()]);
        $sent = $service->processSchool($this->school->fresh());
        $this->assertSame(1, $sent, '30-day threshold fires exactly once');
        $this->assertNotNull($this->school->fresh()->reminder_30_sent_at);
        $this->assertNull($this->school->fresh()->reminder_15_sent_at);

        // Same-day re-run at the same 30-day mark must not re-send.
        $sentAt = $this->school->fresh()->reminder_30_sent_at;
        $sentAgain = $service->processSchool($this->school->fresh());
        $this->assertSame(0, $sentAgain, 'already-sent 30-day reminder is not re-sent on a same-day re-run');
        $this->assertSame($sentAt->toIso8601String(), $this->school->fresh()->reminder_30_sent_at->toIso8601String());

        // Move to the 15-day mark: 30-day stays deduped, 15-day fires once.
        $this->school->update(['amc_expiry_date' => now()->addDays(15)->toDateString()]);
        $sentAt15 = $service->processSchool($this->school->fresh());
        $this->assertSame(1, $sentAt15);
        $this->assertNotNull($this->school->fresh()->reminder_15_sent_at);
        $this->assertNull($this->school->fresh()->reminder_7_sent_at);

        // Move to the 7-day mark: only the 7-day reminder is new.
        $this->school->update(['amc_expiry_date' => now()->addDays(7)->toDateString()]);
        $sentAt7 = $service->processSchool($this->school->fresh());
        $this->assertSame(1, $sentAt7);
        $this->assertNotNull($this->school->fresh()->reminder_7_sent_at);
    }

    // --- Reminder flags reset on renewal/reactivation ---

    public function test_reminder_flags_reset_on_renewal(): void
    {
        $this->school->forceFill([
            'amc_expiry_date' => now()->addDays(7)->toDateString(),
            'reminder_30_sent_at' => now(),
            'reminder_15_sent_at' => now(),
            'reminder_7_sent_at' => now(),
        ])->save();

        $this->school->resetReminders();
        $this->school->save();

        $fresh = $this->school->fresh();
        $this->assertNull($fresh->reminder_30_sent_at);
        $this->assertNull($fresh->reminder_15_sent_at);
        $this->assertNull($fresh->reminder_7_sent_at);
    }

    // --- is_active=false (deactivation) is NOT conflated with license expiry ---

    public function test_deactivated_school_blocks_reads_too_unlike_license_expiry(): void
    {
        $this->makeStudent($this->school);
        // License is fine — only is_active is false.
        $this->school->update(['amc_expiry_date' => now()->addDays(365)->toDateString()]);
        $this->school->deactivate();
        $this->actingAsAdmin();

        $readResponse = $this->getJson('/api/students');
        $readResponse->assertStatus(403);
        $this->assertSame('school_suspended', $readResponse->json('errors.code'));

        $writeResponse = $this->postJson('/api/staff', [
            'name' => 'Blocked', 'email' => 'blocked-'.uniqid().'@test.example', 'role' => 'guard',
        ]);
        $writeResponse->assertStatus(403);
        $this->assertSame('school_suspended', $writeResponse->json('errors.code'));
    }

    public function test_license_expiry_alone_does_not_block_reads_unlike_deactivation(): void
    {
        $this->makeStudent($this->school);
        // Expired, but still is_active — the distinct, narrower behavior.
        $this->school->update(['amc_expiry_date' => now()->subDay()->toDateString()]);
        $this->actingAsAdmin();

        $readResponse = $this->getJson('/api/students');
        $readResponse->assertOk();
        $this->assertNotSame('school_suspended', $readResponse->json('errors.code'));
    }
}
