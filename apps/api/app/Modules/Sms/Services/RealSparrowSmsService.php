<?php

namespace App\Modules\Sms\Services;

use App\Modules\Sms\Models\SmsLog;
use App\Modules\Sms\Models\SmsProviderConfig;
use App\Support\Contracts\SmsServiceInterface;
use App\Support\Enums\SmsLogStatus;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Real Sparrow SMS gateway integration (https://api.sparrowsms.com/v2).
 * Implements exactly the verified API contract — no invented parameters.
 *
 * Credentials come from sms_provider_configs (Prompt 43), not config()/
 * env — resolved per call, not injected once at construction, since
 * which row applies depends on the school_id a given send() targets.
 * There is currently only ever the one platform-wide (school_id null)
 * row every school shares; the school-specific-override lookup is real
 * and will start returning a different row automatically the day a
 * school-specific row is ever inserted, but nothing in this phase builds
 * the UI to create one.
 */
class RealSparrowSmsService implements SmsServiceInterface
{
    private const BASE_URL = 'https://api.sparrowsms.com/v2';

    public function send(string $to, string $message, int $schoolId, ?int $relatedAttendanceRecordId = null): void
    {
        $recipient = $this->normalizePhone($to);
        $credentials = $this->resolveCredentials($schoolId);

        if (! $credentials) {
            // Same "never throw, log a failed attempt instead" contract
            // as a network failure below — a school with no SMS gateway
            // configured must still be able to record attendance (Phase
            // 10's core constraint).
            $this->log($schoolId, $recipient, $message, false, null, 'No active SMS provider credentials configured.', $relatedAttendanceRecordId);

            return;
        }

        try {
            $response = Http::asForm()->post(self::BASE_URL . '/sms/', [
                'token' => $credentials['token'],
                'from' => $credentials['sender_id'],
                'to' => $recipient,
                'text' => $message,
            ]);

            $body = $response->json() ?? [];
            $responseCode = $body['response_code'] ?? null;

            $this->log($schoolId, $recipient, $message, $responseCode === 200, $responseCode, $body['response'] ?? null, $relatedAttendanceRecordId);
        } catch (Throwable $e) {
            // Network/timeout/connection failure — no parseable provider
            // response at all. Never rethrow: a school with SMS trouble
            // must still be able to record attendance (Phase 10's core
            // constraint), so this is caught and logged, not propagated.
            Log::error("Sparrow SMS send failed: {$e->getMessage()}");
            $this->log($schoolId, $recipient, $message, false, null, $e->getMessage(), $relatedAttendanceRecordId);
        }
    }

    /**
     * @return array{credits_available: int, credits_consumed: int}
     */
    public function getCredits(): array
    {
        // No school context here (SmsController::credits() calls this
        // with none) — always the platform-wide default, which is also
        // the only row that exists until a school-specific override is
        // ever built.
        $credentials = $this->resolveCredentials(null);

        if (! $credentials) {
            return ['credits_available' => 0, 'credits_consumed' => 0];
        }

        try {
            $response = Http::get(self::BASE_URL . '/credit/', ['token' => $credentials['token']]);
            $body = $response->json() ?? [];

            return [
                'credits_available' => (int) ($body['credits_available'] ?? 0),
                'credits_consumed' => (int) ($body['credits_consumed'] ?? 0),
            ];
        } catch (Throwable $e) {
            Log::error("Sparrow SMS credit check failed: {$e->getMessage()}");

            return ['credits_available' => 0, 'credits_consumed' => 0];
        }
    }

    /**
     * School-specific row first, platform-wide (school_id null) default
     * otherwise — null when neither exists or is active, which callers
     * treat as "not configured" rather than crashing.
     *
     * @return array{token: string, sender_id: string}|null
     */
    private function resolveCredentials(?int $schoolId): ?array
    {
        $query = SmsProviderConfig::query()->where('provider_name', 'sparrow')->where('is_active', true);

        $config = $schoolId !== null
            ? (clone $query)->where('school_id', $schoolId)->first()
            : null;

        $config ??= (clone $query)->whereNull('school_id')->first();

        if (! $config || empty($config->credentials['token']) || empty($config->credentials['sender_id'])) {
            return null;
        }

        return [
            'token' => $config->credentials['token'],
            'sender_id' => $config->credentials['sender_id'],
        ];
    }

    /**
     * Guardian phones may come from manual entry or the Excel import with
     * inconsistent formatting — strips spaces/dashes and a leading +977/
     * 977/0 country-code or trunk-prefix artifact down to a plain
     * 10-digit number. Nepali mobile numbers never legitimately start
     * with 0, so stripping all leading zeros is always safe here.
     */
    private function normalizePhone(string $phone): string
    {
        $digits = preg_replace('/\D/', '', $phone) ?? '';
        $digits = preg_replace('/^0+/', '', $digits) ?? $digits;

        return preg_replace('/^977/', '', $digits) ?? $digits;
    }

    private function log(
        int $schoolId,
        string $recipient,
        string $message,
        bool $success,
        ?int $responseCode,
        ?string $responseMessage,
        ?int $relatedAttendanceRecordId,
    ): void {
        SmsLog::create([
            'school_id' => $schoolId,
            'recipient_phone' => $recipient,
            'message' => $message,
            'status' => $success ? SmsLogStatus::Sent : SmsLogStatus::Failed,
            'provider_response_code' => $responseCode,
            'provider_response_message' => $responseMessage,
            'related_attendance_record_id' => $relatedAttendanceRecordId,
            'sent_at' => now(),
        ]);
    }
}
