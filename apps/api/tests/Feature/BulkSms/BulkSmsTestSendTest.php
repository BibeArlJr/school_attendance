<?php

namespace Tests\Feature\BulkSms;

use App\Modules\BulkSms\Models\BulkSmsContact;
use App\Modules\BulkSms\Models\BulkSmsProviderConfig;
use App\Modules\BulkSms\Models\BulkSmsSendLog;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\Support\CreatesTestData;
use Tests\TestCase;

/**
 * Stage 2's core safety boundary, proven end-to-end: exactly one scalar
 * recipient in, at most one Sparrow HTTP call out, and no code path in
 * this endpoint can ever reach bulk_sms_contacts/bulk_sms_uploads.
 * Every Sparrow response is Http::fake()'d — this suite never makes a
 * real network call.
 */
class BulkSmsTestSendTest extends TestCase
{
    use CreatesTestData;

    private \App\Models\User $superAdmin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->superAdmin = $this->makeSuperAdmin();
        Sanctum::actingAs($this->superAdmin->fresh(), ['*']);
    }

    private function configureRealCredential(): void
    {
        config(['services.bulk_sms.driver' => 'real']);
        BulkSmsProviderConfig::create([
            'token' => 'test-token-value',
            'sender_id' => 'TestSender',
            'is_active' => true,
        ]);
    }

    public function test_non_super_admin_is_forbidden(): void
    {
        $school = $this->makeSchool();
        $admin = $this->makeUser($school, \App\Support\Enums\UserRole::Admin);
        Sanctum::actingAs($admin->fresh(), ['*']);

        $this->postJson('/api/bulk-sms/test-send', ['phone' => '9841234567', 'message' => 'hi'])
            ->assertForbidden();
    }

    public function test_accepts_one_scalar_recipient_and_sends_exactly_one_sparrow_request(): void
    {
        $this->configureRealCredential();
        Http::fake(['https://api.sparrowsms.com/v2/sms/' => Http::response(['response_code' => 200, 'response' => 'ok'], 200)]);

        $response = $this->postJson('/api/bulk-sms/test-send', [
            'phone' => '9841234567',
            'message' => 'Test message',
        ])->assertOk();

        $response->assertJsonPath('data.recipient', '9841234567');
        $response->assertJsonPath('data.status', 'sent');

        // Proves item 5: exactly one Sparrow HTTP request per valid
        // test-send request.
        Http::assertSentCount(1);
        $this->assertSame(1, BulkSmsSendLog::query()->count());
    }

    public function test_array_in_phone_field_is_rejected(): void
    {
        Http::fake();

        $response = $this->postJson('/api/bulk-sms/test-send', [
            'phone' => ['9841234567', '9851234567'],
            'message' => 'hi',
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('phone');
        Http::assertNothingSent();
        $this->assertSame(0, BulkSmsSendLog::query()->count());
    }

    public function test_comma_separated_multiple_numbers_in_phone_is_rejected(): void
    {
        Http::fake();

        $response = $this->postJson('/api/bulk-sms/test-send', [
            'phone' => '9841234567,9851234567',
            'message' => 'hi',
        ]);

        $response->assertUnprocessable();
        Http::assertNothingSent();
    }

    public function test_bulk_recipient_shaped_payload_fields_are_all_rejected(): void
    {
        Http::fake();

        $dangerousFields = [
            'contact_id' => 1,
            'contact_ids' => [1, 2, 3],
            'upload_id' => 5,
            'selected_ids' => [1, 2],
            'all' => true,
            'send_all' => true,
        ];

        foreach ($dangerousFields as $field => $value) {
            $response = $this->postJson('/api/bulk-sms/test-send', [
                'phone' => '9841234567',
                'message' => 'hi',
                $field => $value,
            ]);

            $response->assertUnprocessable();
            $response->assertJsonValidationErrors($field);
        }

        Http::assertNothingSent();
        $this->assertSame(0, BulkSmsSendLog::query()->count());
    }

    public function test_invalid_phone_is_rejected_before_any_sparrow_call(): void
    {
        $this->configureRealCredential();
        Http::fake();

        $response = $this->postJson('/api/bulk-sms/test-send', [
            'phone' => 'not-a-number',
            'message' => 'hi',
        ]);

        $response->assertUnprocessable();
        Http::assertNothingSent();
        $this->assertSame(0, BulkSmsSendLog::query()->count());
    }

    public function test_mock_driver_makes_zero_real_http_requests(): void
    {
        // Default driver is 'mock' (never overridden in this test).
        Http::fake();

        $response = $this->postJson('/api/bulk-sms/test-send', [
            'phone' => '9841234567',
            'message' => 'hi',
        ])->assertOk();

        $response->assertJsonPath('data.status', 'mock');
        Http::assertNothingSent();

        $log = BulkSmsSendLog::query()->first();
        $this->assertNotNull($log);
        $this->assertSame('mock', $log->status);
    }

    public function test_simulated_sparrow_failure_is_logged_as_failed_not_thrown(): void
    {
        $this->configureRealCredential();
        Http::fake(['https://api.sparrowsms.com/v2/sms/' => Http::response(['response_code' => 1002, 'response' => 'Invalid token'], 200)]);

        $response = $this->postJson('/api/bulk-sms/test-send', [
            'phone' => '9841234567',
            'message' => 'hi',
        ]);

        // The HTTP attempt itself didn't throw — the endpoint responds
        // normally and records the failure, exactly like the attendance
        // system's own "never block on a provider failure" contract.
        $response->assertOk();
        $response->assertJsonPath('data.status', 'failed');
        $response->assertJsonPath('data.provider_response_code', 1002);

        $log = BulkSmsSendLog::query()->first();
        $this->assertSame('failed', $log->status);
        $this->assertNull($log->sent_at);
    }

    public function test_simulated_network_timeout_is_handled_the_same_way(): void
    {
        $this->configureRealCredential();
        Http::fake(function () {
            throw new ConnectionException('Connection timed out');
        });

        $response = $this->postJson('/api/bulk-sms/test-send', [
            'phone' => '9841234567',
            'message' => 'hi',
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.status', 'failed');

        $log = BulkSmsSendLog::query()->first();
        $this->assertSame('failed', $log->status);
        $this->assertNull($log->provider_response_code);
    }

    public function test_second_request_for_same_number_within_five_seconds_is_throttled(): void
    {
        $this->configureRealCredential();
        Http::fake(['https://api.sparrowsms.com/v2/sms/' => Http::response(['response_code' => 200, 'response' => 'ok'], 200)]);

        $this->postJson('/api/bulk-sms/test-send', ['phone' => '9841234567', 'message' => 'first'])
            ->assertOk();

        $second = $this->postJson('/api/bulk-sms/test-send', ['phone' => '9841234567', 'message' => 'second']);
        $second->assertStatus(429);

        // Only the first request ever reached Sparrow.
        Http::assertSentCount(1);
        $this->assertSame(1, BulkSmsSendLog::query()->count());
    }

    public function test_test_send_never_queries_bulk_sms_contacts_or_uploads_tables(): void
    {
        $this->configureRealCredential();
        Http::fake(['https://api.sparrowsms.com/v2/sms/' => Http::response(['response_code' => 200, 'response' => 'ok'], 200)]);

        // Real stored contacts exist — proves the endpoint's silence on
        // these tables isn't just because they're empty.
        BulkSmsContact::create(['name' => 'Real Contact', 'phone' => '9800000001']);
        BulkSmsContact::create(['name' => 'Real Contact 2', 'phone' => '9800000002']);

        $queries = [];
        DB::listen(function ($query) use (&$queries) {
            $queries[] = $query->sql;
        });

        $this->postJson('/api/bulk-sms/test-send', [
            'phone' => '9841234567',
            'message' => 'hi',
        ])->assertOk();

        $this->assertNotEmpty($queries, 'Expected at least one query to have run.');
        foreach ($queries as $sql) {
            $this->assertStringNotContainsString('bulk_sms_contacts', $sql);
            $this->assertStringNotContainsString('bulk_sms_uploads', $sql);
        }
    }
}
