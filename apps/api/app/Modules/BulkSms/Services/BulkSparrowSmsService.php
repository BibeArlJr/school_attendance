<?php

namespace App\Modules\BulkSms\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Independent Sparrow HTTP integration for the Bulk SMS module —
 * deliberately NOT a reuse, extension, or modification of
 * App\Modules\Sms\Services\RealSparrowSmsService. Mirrors only the
 * already-verified Sparrow API contract that class uses (same endpoints,
 * same form fields), against BulkSmsCredentialService's credential only.
 *
 * Gated end-to-end by config('services.bulk_sms.driver'): when it isn't
 * exactly 'real', NEITHER send() NOR getCredits() ever makes a real HTTP
 * request — both return a clearly-labeled mock result instead. This is
 * the actual kill switch, not just a UI affordance.
 */
class BulkSparrowSmsService
{
    private const BASE_URL = 'https://api.sparrowsms.com/v2';

    /** Explicit timeout on every real Sparrow call — a hung connection
     *  must fail cleanly, never hang the request indefinitely. */
    private const TIMEOUT_SECONDS = 8;

    public function __construct(private readonly BulkSmsCredentialService $credentialService)
    {
    }

    /**
     * @return array{status: 'sent'|'failed'|'mock', response_code: ?int, response_message: ?string}
     */
    public function send(string $to, string $message): array
    {
        if (! $this->isRealDriver()) {
            return [
                'status' => 'mock',
                'response_code' => null,
                'response_message' => 'Mock send — BULK_SMS_DRIVER is not "real". No request was made to Sparrow.',
            ];
        }

        $credentials = $this->credentialService->getRawCredentials();

        if (! $credentials) {
            return [
                'status' => 'failed',
                'response_code' => null,
                'response_message' => 'No active bulk SMS credential configured.',
            ];
        }

        try {
            $response = Http::asForm()->timeout(self::TIMEOUT_SECONDS)->post(self::BASE_URL.'/sms/', [
                'token' => $credentials['token'],
                'from' => $credentials['sender_id'],
                'to' => $to,
                'text' => $message,
            ]);

            $body = $response->json() ?? [];
            $responseCode = $body['response_code'] ?? null;

            return [
                'status' => $responseCode === 200 ? 'sent' : 'failed',
                'response_code' => $responseCode,
                'response_message' => $body['response'] ?? null,
            ];
        } catch (Throwable $e) {
            // Network/timeout/connection failure — no parseable provider
            // response at all. Never rethrown: a failed test-send is a
            // recorded outcome, not an unhandled exception.
            Log::error('Bulk Sparrow SMS test-send failed', ['error' => $e->getMessage()]);

            return ['status' => 'failed', 'response_code' => null, 'response_message' => $e->getMessage()];
        }
    }

    /**
     * @return array{configured: bool, credits_available: int, credits_consumed: int, mock: bool, error: ?string}
     */
    public function getCredits(): array
    {
        $configured = $this->credentialService->isConfigured();

        if (! $this->isRealDriver()) {
            return [
                'configured' => $configured,
                'credits_available' => 9999,
                'credits_consumed' => 0,
                'mock' => true,
                'error' => null,
            ];
        }

        $credentials = $this->credentialService->getRawCredentials();

        if (! $credentials) {
            return [
                'configured' => false,
                'credits_available' => 0,
                'credits_consumed' => 0,
                'mock' => false,
                'error' => 'No active bulk SMS credential configured.',
            ];
        }

        try {
            $response = Http::timeout(self::TIMEOUT_SECONDS)->get(self::BASE_URL.'/credit/', ['token' => $credentials['token']]);
            $body = $response->json() ?? [];

            return [
                'configured' => true,
                'credits_available' => (int) ($body['credits_available'] ?? 0),
                'credits_consumed' => (int) ($body['credits_consumed'] ?? 0),
                'mock' => false,
                'error' => null,
            ];
        } catch (Throwable $e) {
            Log::error('Bulk Sparrow SMS credit check failed', ['error' => $e->getMessage()]);

            return [
                'configured' => true,
                'credits_available' => 0,
                'credits_consumed' => 0,
                'mock' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    private function isRealDriver(): bool
    {
        return config('services.bulk_sms.driver') === 'real';
    }
}
