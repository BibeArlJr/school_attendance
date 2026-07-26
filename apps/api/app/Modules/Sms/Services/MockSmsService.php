<?php

namespace App\Modules\Sms\Services;

use App\Modules\Sms\Models\SmsLog;
use App\Support\Contracts\SmsServiceInterface;
use App\Support\Enums\SmsLogStatus;
use Illuminate\Support\Facades\Log;

/**
 * Must produce a visible, obviously-fake effect per the mock-service
 * pattern doc — logs prominently rather than silently succeeding. Also
 * persists to sms_logs (Phase 10) so the real SMS Log page works
 * identically regardless of which driver is active — the mock's fake
 * sends are just as visible there as a real gateway's.
 */
class MockSmsService implements SmsServiceInterface
{
    public function send(string $to, string $message, int $schoolId, ?int $relatedAttendanceRecordId = null): void
    {
        Log::info('[MOCK SMS] send', [
            'school_id' => $schoolId,
            'recipient' => $to,
            'attendance_record_id' => $relatedAttendanceRecordId,
        ]);

        SmsLog::create([
            'school_id' => $schoolId,
            'recipient_phone' => $to,
            'message' => $message,
            'status' => SmsLogStatus::Sent,
            'provider_response_code' => 200,
            'provider_response_message' => 'Mock send — no real gateway called.',
            'related_attendance_record_id' => $relatedAttendanceRecordId,
            'sent_at' => now(),
        ]);
    }

    /**
     * A clearly-fake, round-number balance — the SMS Log page's credit
     * card must label this "Mock mode" rather than presenting it as a
     * real number (see SmsController).
     *
     * @return array{credits_available: int, credits_consumed: int}
     */
    public function getCredits(): array
    {
        return ['credits_available' => 9999, 'credits_consumed' => 0];
    }
}
