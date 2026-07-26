<?php

namespace Tests\Feature\MultiTenant;

use App\Models\User;
use App\Modules\Attendance\Models\AttendanceRecord;
use App\Modules\School\Models\School;
use App\Modules\Sms\Models\SmsLog;
use App\Modules\Student\Models\Student;
use App\Support\Concerns\BelongsToSchool;
use App\Support\Enums\AttendanceRecordStatus;
use App\Support\Enums\RecordDayType;
use App\Support\Enums\SmsLogStatus;
use App\Support\Enums\UserRole;
use Illuminate\Support\Facades\Auth;
use Laravel\Sanctum\Sanctum;
use Tests\Support\CreatesTestData;
use Tests\TestCase;

/**
 * Prompt 46 Suite B — the highest-priority suite in this prompt. Turns
 * Prompt 40's real 23-attack manual verification (a leaked UUID plus any
 * valid token from ANY school was enough to view/edit/delete it, across
 * this app's entire tenant-scoped surface) into permanent, automated
 * regression coverage, so this specific class of vulnerability can never
 * silently come back.
 */
class MultiTenantIsolationTest extends TestCase
{
    use CreatesTestData;

    private School $schoolA;

    private School $schoolB;

    private User $adminA;

    private User $adminB;

    protected function setUp(): void
    {
        parent::setUp();

        $this->schoolA = $this->makeSchool(['name' => 'School A']);
        $this->schoolB = $this->makeSchool(['name' => 'School B']);
        $this->adminA = $this->makeUser($this->schoolA, UserRole::Admin);
        $this->adminB = $this->makeUser($this->schoolB, UserRole::Admin);
    }

    private function actingAsAdminA(): void
    {
        Sanctum::actingAs($this->adminA, ['*']);
    }

    // --- Cross-school 404 (not 403) for at least 7 tenant-scoped resources ---

    public function test_student_cross_school_access_is_404_for_show_update_and_destroy(): void
    {
        $student = $this->makeStudent($this->schoolB);
        $this->actingAsAdminA();

        $this->getJson("/api/students/{$student->uuid}")->assertNotFound();
        $this->putJson("/api/students/{$student->uuid}", [
            'class_id' => $this->makeClass($this->schoolB)->id,
            'first_name' => 'Hacked',
            'last_name' => 'Name',
            'dob' => '2015-01-01',
            'gender' => 'male',
            'admission_date' => '2026-04-14',
        ])->assertNotFound();
        $this->deleteJson("/api/students/{$student->uuid}")->assertNotFound();

        $this->assertDatabaseHas('students', ['id' => $student->id, 'first_name' => $student->first_name]);
    }

    public function test_staff_cross_school_access_is_404_for_show_update_and_destroy(): void
    {
        $staff = $this->makeStaff($this->schoolB);
        $this->actingAsAdminA();

        $this->getJson("/api/staff/{$staff->uuid}")->assertNotFound();
        $this->putJson("/api/staff/{$staff->uuid}", [
            'name' => 'Hacked',
            'email' => 'hacked-'.uniqid().'@test.example',
        ])->assertNotFound();
        $this->deleteJson("/api/staff/{$staff->uuid}")->assertNotFound();

        $this->assertDatabaseHas('staff', ['id' => $staff->id]);
    }

    public function test_parent_cross_school_access_is_404_for_show_update_and_destroy(): void
    {
        $parent = $this->makeParentGuardian($this->schoolB);
        $this->actingAsAdminA();

        $this->getJson("/api/parents/{$parent->uuid}")->assertNotFound();
        $this->putJson("/api/parents/{$parent->uuid}", [
            'name' => 'Hacked', 'phone' => '9899999999',
        ])->assertNotFound();
        $this->deleteJson("/api/parents/{$parent->uuid}")->assertNotFound();

        $this->assertDatabaseHas('parent_guardians', ['id' => $parent->id, 'name' => $parent->name]);
    }

    public function test_class_cross_school_access_is_404_for_update_and_destroy(): void
    {
        $class = $this->makeClass($this->schoolB);
        $this->actingAsAdminA();

        $this->putJson("/api/classes/{$class->uuid}", ['name' => 'Hacked Class'])->assertNotFound();
        $this->deleteJson("/api/classes/{$class->uuid}")->assertNotFound();

        $this->assertDatabaseHas('classes', ['id' => $class->id, 'name' => $class->name]);
    }

    public function test_attendance_record_cross_school_access_is_404_for_update(): void
    {
        $student = $this->makeStudent($this->schoolB);
        $record = AttendanceRecord::forceCreate([
            'school_id' => $this->schoolB->id,
            'owner_type' => 'student',
            'owner_id' => $student->id,
            'date' => '2026-08-10',
            'in_time' => '08:05:00',
            'status' => AttendanceRecordStatus::Present,
            'day_type' => RecordDayType::Working,
        ]);
        $this->actingAsAdminA();

        $this->patchJson("/api/attendance-records/{$record->id}", [
            'override_reason' => 'attempted cross-school correction',
            'status' => 'absent',
        ])->assertNotFound();

        $this->assertDatabaseHas('attendance_records', ['id' => $record->id, 'status' => 'present']);
    }

    public function test_id_card_cross_school_access_is_404_via_scoped_student_binding(): void
    {
        $student = $this->makeStudent($this->schoolB);
        $this->makeIdCard($this->schoolB, $student);
        $this->actingAsAdminA();

        $this->getJson("/api/students/{$student->uuid}/id-card")->assertNotFound();
    }

    public function test_sms_log_index_never_leaks_another_schools_rows(): void
    {
        SmsLog::forceCreate([
            'school_id' => $this->schoolB->id,
            'recipient_phone' => '9800000001',
            'message' => 'School B message — must never be visible to School A',
            'status' => SmsLogStatus::Sent,
            'sent_at' => now(),
        ]);
        SmsLog::forceCreate([
            'school_id' => $this->schoolA->id,
            'recipient_phone' => '9800000002',
            'message' => 'School A message',
            'status' => SmsLogStatus::Sent,
            'sent_at' => now(),
        ]);
        $this->actingAsAdminA();

        $response = $this->getJson('/api/sms-logs')->assertOk();
        $messages = collect($response->json('data.data'))->pluck('message');

        $this->assertTrue($messages->contains('School A message'));
        $this->assertFalse($messages->contains(fn ($m) => str_contains($m, 'School B')));
    }

    // --- super_admin active-school scoping ---

    public function test_super_admin_with_active_school_set_scopes_to_that_school_and_switching_rescopes(): void
    {
        $studentA = $this->makeStudent($this->schoolA, null, ['first_name' => 'StudentA']);
        $studentB = $this->makeStudent($this->schoolB, null, ['first_name' => 'StudentB']);
        $superAdmin = $this->makeSuperAdmin();

        $superAdmin->update(['active_school_id' => $this->schoolA->id]);
        Sanctum::actingAs($superAdmin->fresh(), ['*']);

        $names = collect($this->getJson('/api/students')->assertOk()->json('data.data'))->pluck('first_name');
        $this->assertTrue($names->contains('StudentA'));
        $this->assertFalse($names->contains('StudentB'));

        $this->postJson('/api/platform/active-school', ['school_id' => $this->schoolB->id])->assertOk();
        // A fresh Sanctum::actingAs re-reads the updated active_school_id
        // from the database, exactly like a real subsequent HTTP request
        // would resolve $request->user() fresh from the token each time.
        Sanctum::actingAs($superAdmin->fresh(), ['*']);

        $namesAfterSwitch = collect($this->getJson('/api/students')->assertOk()->json('data.data'))->pluck('first_name');
        $this->assertTrue($namesAfterSwitch->contains('StudentB'));
        $this->assertFalse($namesAfterSwitch->contains('StudentA'));
    }

    public function test_super_admin_with_no_active_school_selected_fails_closed_at_the_query_scope_level(): void
    {
        $this->makeStudent($this->schoolA);
        $this->makeStudent($this->schoolB);
        $superAdmin = $this->makeSuperAdmin(['active_school_id' => null]);

        Auth::login($superAdmin);
        try {
            // The BelongsToSchool global scope itself, exercised directly
            // (not through a controller) — this is the literal mechanism
            // the acceptance criteria describes: zero rows, not an error,
            // not every school's rows either.
            $this->assertSame(0, Student::query()->count());
        } finally {
            Auth::logout();
        }
    }

    public function test_super_admin_with_no_active_school_selected_leaks_nothing_via_the_http_api_either(): void
    {
        $this->makeStudent($this->schoolA);
        $this->makeStudent($this->schoolB);
        $superAdmin = $this->makeSuperAdmin(['active_school_id' => null]);
        Sanctum::actingAs($superAdmin, ['*']);

        // This particular endpoint resolves its target school via
        // CurrentSchoolResolver (which throws for an unselected
        // super_admin) rather than relying on the global scope alone —
        // still fails closed: a clean 409, zero rows, no other school's
        // data or even existence disclosed.
        $response = $this->getJson('/api/students')->assertStatus(409);
        $this->assertSame('no_active_school', $response->json('errors.code'));
    }

    // --- create operations always stamp the current school, never a client-supplied one ---

    public function test_create_student_ignores_a_smuggled_school_id_and_stamps_the_real_one(): void
    {
        $class = $this->makeClass($this->schoolA);
        $this->actingAsAdminA();

        $response = $this->postJson('/api/students', [
            'school_id' => $this->schoolB->id, // smuggled — must be ignored
            'class_id' => $class->id,
            'first_name' => 'New',
            'last_name' => 'Student',
            'dob' => '2015-06-01',
            'gender' => 'male',
            'admission_date' => '2026-04-14',
        ])->assertCreated();

        $this->assertDatabaseHas('students', [
            'id' => $response->json('data.id'),
            'school_id' => $this->schoolA->id,
        ]);
        $this->assertDatabaseMissing('students', [
            'id' => $response->json('data.id'),
            'school_id' => $this->schoolB->id,
        ]);
    }

    public function test_create_staff_ignores_a_smuggled_school_id_and_stamps_the_real_one(): void
    {
        $this->actingAsAdminA();

        $response = $this->postJson('/api/staff', [
            'school_id' => $this->schoolB->id, // smuggled — must be ignored
            'name' => 'New Guard',
            'email' => 'new-guard-'.uniqid().'@test.example',
            'role' => 'guard',
        ])->assertCreated();

        $userId = User::query()->where('email', 'like', 'new-guard-%')->latest('id')->value('id');
        $this->assertDatabaseHas('users', ['id' => $userId, 'school_id' => $this->schoolA->id]);
    }

    // --- Gate Scanner: cross-school barcode is cleanly rejected ---

    public function test_gate_scanner_rejects_a_barcode_belonging_to_a_different_school(): void
    {
        $studentB = $this->makeStudent($this->schoolB);
        $cardB = $this->makeIdCard($this->schoolB, $studentB, 'student', 'BC-SCHOOL-B-STUDENT');
        $guardA = $this->makeUser($this->schoolA, UserRole::Guard);
        Sanctum::actingAs($guardA, ['*']);

        $response = $this->postJson('/api/gate-scanner/scan', [
            'barcode_value' => $cardB->barcode_value,
        ])->assertOk();

        $this->assertSame('unknown_barcode', $response->json('data.result'));
        $this->assertNull($response->json('data.student'));
        $this->assertSame(0, AttendanceRecord::query()->withoutGlobalScope(BelongsToSchool::class)->count());
    }
}
