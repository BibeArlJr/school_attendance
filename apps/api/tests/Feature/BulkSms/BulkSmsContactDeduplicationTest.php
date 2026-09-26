<?php

namespace Tests\Feature\BulkSms;

use App\Modules\BulkSms\Models\BulkSmsContact;
use App\Support\Enums\UserRole;
use Illuminate\Http\UploadedFile;
use Laravel\Sanctum\Sanctum;
use Tests\Support\CreatesTestData;
use Tests\TestCase;

/**
 * Real end-to-end coverage (not just the normalizer's own unit tests) —
 * confirms that two differently-formatted representations of the SAME
 * real number can never both end up as separate bulk_sms_contacts rows,
 * whether one arrives via manual add or via an uploaded file, and that
 * platform-admin gating is genuinely enforced on these routes.
 */
class BulkSmsContactDeduplicationTest extends TestCase
{
    use CreatesTestData;

    private \App\Models\User $superAdmin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->superAdmin = $this->makeSuperAdmin();
    }

    private function actingAsSuperAdmin(): void
    {
        Sanctum::actingAs($this->superAdmin->fresh(), ['*']);
    }

    public function test_non_super_admin_is_forbidden_from_every_bulk_sms_route(): void
    {
        $school = $this->makeSchool();
        $admin = $this->makeUser($school, UserRole::Admin);
        Sanctum::actingAs($admin->fresh(), ['*']);

        $this->getJson('/api/bulk-sms/contacts')->assertForbidden();
        $this->postJson('/api/bulk-sms/contacts', ['phone' => '9841234567'])->assertForbidden();
        $this->getJson('/api/bulk-sms/uploads')->assertForbidden();
    }

    public function test_manually_adding_a_differently_formatted_duplicate_is_rejected(): void
    {
        $this->actingAsSuperAdmin();

        $this->postJson('/api/bulk-sms/contacts', [
            'name' => 'Ram Sharma',
            'phone' => '9841234567',
        ])->assertCreated();

        $this->assertSame(1, BulkSmsContact::query()->count());

        // Same real number, four different formats — every one of them
        // must be rejected as a duplicate of the row above, not
        // accidentally accepted as "different" because the digits look
        // different before normalization.
        foreach (['09841234567', '+9779841234567', '9779841234567', '00 977 984 123 4567'] as $variant) {
            $response = $this->postJson('/api/bulk-sms/contacts', [
                'name' => 'Someone Else',
                'phone' => $variant,
            ]);

            $response->assertUnprocessable();
            $response->assertJsonValidationErrors('phone');
        }

        $this->assertSame(1, BulkSmsContact::query()->count());
        $this->assertSame('9841234567', BulkSmsContact::query()->first()->phone);
    }

    public function test_upload_preview_flags_duplicate_against_an_existing_contact(): void
    {
        $this->actingAsSuperAdmin();

        BulkSmsContact::create(['name' => 'Existing Contact', 'phone' => '9841234567']);

        $file = UploadedFile::fake()->createWithContent(
            'contacts.csv',
            "Name,Phone\nAnother Name,+977 984 123 4567\n",
        );

        $response = $this->postJson('/api/bulk-sms/uploads/preview', ['file' => $file])->assertOk();

        $response->assertJsonPath('data.total_rows', 1);
        $response->assertJsonPath('data.valid_rows', 0);
        $response->assertJsonPath('data.duplicate_rows', 1);
        $response->assertJsonPath('data.rows.0.status', 'duplicate');
        $response->assertJsonPath('data.rows.0.phone_normalized', '9841234567');

        // preview() must never write anything, even when it finds a
        // duplicate — still exactly the one pre-existing contact.
        $this->assertSame(1, BulkSmsContact::query()->count());
    }

    public function test_upload_preview_flags_duplicates_within_the_same_file(): void
    {
        $this->actingAsSuperAdmin();

        $file = UploadedFile::fake()->createWithContent(
            'contacts.csv',
            "Name,Phone\nFirst,9841234567\nSecond,09841234567\nThird,9779841234567\n",
        );

        $response = $this->postJson('/api/bulk-sms/uploads/preview', ['file' => $file])->assertOk();

        $response->assertJsonPath('data.total_rows', 3);
        $response->assertJsonPath('data.valid_rows', 1);
        $response->assertJsonPath('data.duplicate_rows', 2);
        $response->assertJsonPath('data.rows.0.status', 'valid');
        $response->assertJsonPath('data.rows.1.status', 'duplicate');
        $response->assertJsonPath('data.rows.2.status', 'duplicate');

        $this->assertSame(0, BulkSmsContact::query()->count());
    }

    public function test_confirm_persists_only_the_normalized_number_and_skips_duplicates(): void
    {
        $this->actingAsSuperAdmin();

        $payload = [
            'file_name' => 'contacts.csv',
            'rows' => [
                ['name' => 'First', 'phone' => '9841234567'],
                // Same real number, differently formatted — must be
                // skipped, not inserted as a second row.
                ['name' => 'Duplicate Of First', 'phone' => '+977 984 123 4567'],
                ['name' => 'Second', 'phone' => '09851234567'],
                ['name' => 'Invalid One', 'phone' => 'not-a-number'],
            ],
        ];

        $response = $this->postJson('/api/bulk-sms/uploads/confirm', $payload)->assertOk();

        $response->assertJsonPath('data.created', 2);
        $response->assertJsonPath('data.skipped', 2);

        $this->assertSame(2, BulkSmsContact::query()->count());
        $this->assertEqualsCanonicalizing(
            ['9841234567', '9851234567'],
            BulkSmsContact::query()->pluck('phone')->all(),
        );

        // Only the normalized value is ever persisted — phone_raw is not
        // a column on this table at all (see the migration's docblock).
        $this->assertFalse(
            \Illuminate\Support\Facades\Schema::hasColumn('bulk_sms_contacts', 'phone_raw'),
        );
    }

    public function test_upload_preview_recognizes_a_bare_number_header_with_trailing_space(): void
    {
        $this->actingAsSuperAdmin();

        // Real single-column contact list: only a "Number " header (note
        // the trailing space, as in the actual uploaded file that
        // exposed this) — no Name column at all.
        $file = UploadedFile::fake()->createWithContent(
            'contacts.csv',
            "Number \n9841234567\n",
        );

        $response = $this->postJson('/api/bulk-sms/uploads/preview', ['file' => $file])->assertOk();

        $response->assertJsonPath('data.skipped_sheets', []);
        $response->assertJsonPath('data.total_rows', 1);
        $response->assertJsonPath('data.valid_rows', 1);
        $response->assertJsonPath('data.rows.0.status', 'valid');
        $response->assertJsonPath('data.rows.0.phone_normalized', '9841234567');
        $response->assertJsonPath('data.rows.0.name', null);
    }
}
