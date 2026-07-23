<?php

namespace App\Modules\Sms\Services;

use App\Modules\Sms\Models\SmsLog;
use App\Support\Contracts\SmsServiceInterface;
use App\Support\Enums\SmsLogStatus;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Real Sparrow SMS gateway integration (https://api.sparrowsms.com/v2).
 * Implements exactly the verified API contract — no invented parameters.
 */
class RealSparrowSmsService implements SmsServiceInterface
{
    private const BASE_URL = 'https://api.sparrowsms.com/v2';

    public function __construct(
        private readonly string $token,
        private readonly string $senderId,
    ) {
    }

    public function send(string $to, string $message, int $schoolId, ?int $relatedAttendanceRecordId = null): void
    {
        $recipient = $this->normalizePhone($to);

        try {
            $response = Http::asForm()->post(self::BASE_URL . '/sms/', [
                'token' => $this->token,
                'from' => $this->senderId,
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
        try {
            $response = Http::get(self::BASE_URL . '/credit/', ['token' => $this->token]);
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
