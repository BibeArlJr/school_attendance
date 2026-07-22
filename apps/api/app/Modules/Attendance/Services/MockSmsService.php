<?php

namespace App\Modules\Attendance\Services;

use App\Support\Contracts\SmsServiceInterface;
use Illuminate\Support\Facades\Log;

/**
 * Must produce a visible, obviously-fake effect per the mock-service
 * pattern doc — logs prominently rather than silently succeeding. No real
 * SMS gateway exists yet (see Phase 7's SMS Log module, still a
 * placeholder).
 */
class MockSmsService implements SmsServiceInterface
{
    public function send(string $to, string $message): void
    {
        Log::info("[MOCK SMS] To: {$to} | Message: {$message}");
    }
}
