<?php

namespace Tests\Feature\BulkSms;

use App\Modules\BulkSms\Models\BulkSmsProviderConfig;
use App\Support\Enums\UserRole;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\Support\CreatesTestData;
use Tests\TestCase;

class BulkSmsCredentialTest extends TestCase
{
    use CreatesTestData;

    private \App\Models\User $superAdmin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->superAdmin = $this->makeSuperAdmin();
        Sanctum::actingAs($this->superAdmin->fresh(), ['*']);
    }

    public function test_non_super_admin_is_forbidden(): void
    {
        $school = $this->makeSchool();
        $admin = $this->makeUser($school, UserRole::Admin);
        Sanctum::actingAs($admin->fresh(), ['*']);

        $this->getJson('/api/bulk-sms/credential')->assertForbidden();
        $this->putJson('/api/bulk-sms/credential', ['token' => 'x', 'sender_id' => 'y'])->assertForbidden();
        $this->getJson('/api/bulk-sms/credential/credits')->assertForbidden();
    }

    public function test_show_reports_not_configured_when_no_row_exists(): void
    {
        $response = $this->getJson('/api/bulk-sms/credential')->assertOk();

        $response->assertJsonPath('data.configured', false);
        $response->assertJsonPath('data.masked_token', null);
    }

    public function test_update_stores_the_token_encrypted_and_api_always_returns_it_masked(): void
    {
        $response = $this->putJson('/api/bulk-sms/credential', [
            'token' => 'sparrow-real-secret-value-12345',
            'sender_id' => 'MySchool',
        ])->assertOk();

        $response->assertJsonPath('data.configured', true);
        $response->assertJsonPath('data.sender_id', 'MySchool');
        // Only the last 4 characters, never the full value.
        $response->assertJsonPath('data.masked_token', '••••2345');
        $this->assertStringNotContainsString('sparrow-real-secret-value-12345', $response->getContent());

        // The raw DB column is genuinely ciphertext, not the plaintext
        // token — reading it directly (bypassing Eloquent's cast).
        $rawColumnValue = DB::table('bulk_sms_provider_configs')->value('token');
        $this->assertNotSame('sparrow-real-secret-value-12345', $rawColumnValue);
        $this->assertStringNotContainsString('sparrow-real-secret-value-12345', $rawColumnValue);

        // Re-fetching via the model (which decrypts) still shows the
        // real value server-side — the masking is an API-response-layer
        // decision, not silent data loss.
        $config = BulkSmsProviderConfig::query()->first();
        $this->assertSame('sparrow-real-secret-value-12345', $config->token);

        // A second GET also never leaks the full token.
        $show = $this->getJson('/api/bulk-sms/credential')->assertOk();
        $show->assertJsonPath('data.masked_token', '••••2345');
        $this->assertStringNotContainsString('sparrow-real-secret-value-12345', $show->getContent());
    }

    public function test_credits_check_never_sends_an_sms_under_mock_driver(): void
    {
        Http::fake();
        BulkSmsProviderConfig::create(['token' => 'x', 'sender_id' => 'y', 'is_active' => true]);

        $response = $this->getJson('/api/bulk-sms/credential/credits')->assertOk();

        $response->assertJsonPath('data.mock', true);
        Http::assertNothingSent();
    }

    public function test_credits_check_never_sends_an_sms_under_real_driver_either(): void
    {
        config(['services.bulk_sms.driver' => 'real']);
        BulkSmsProviderConfig::create(['token' => 'x', 'sender_id' => 'y', 'is_active' => true]);
        Http::fake(['https://api.sparrowsms.com/v2/credit/*' => Http::response(['credits_available' => 42, 'credits_consumed' => 8], 200)]);

        $response = $this->getJson('/api/bulk-sms/credential/credits')->assertOk();

        $response->assertJsonPath('data.credits_available', 42);
        // Exactly one HTTP call total, and it was the credit-check GET,
        // never the /sms/ send endpoint.
        Http::assertSentCount(1);
        Http::assertSent(fn ($request) => str_contains($request->url(), '/credit/') && ! str_contains($request->url(), '/sms/'));
    }
}
