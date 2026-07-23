<?php

namespace App\Support\Contracts;

/**
 * Backend half of the mock-service pattern (see
 * docs/architecture/service-pattern.md's "Backend (Laravel)" section) —
 * distinct from the frontend's INotificationService, which lives in
 * apps/web and shows an in-app toast. This is the actual SMS-to-parent
 * delivery, triggered server-side from AttendanceService so it fires
 * regardless of whether anyone's browser tab is open.
 */
interface SmsServiceInterface
{
    /**
     * Never throws — a delivery failure (bad credentials, no credits,
     * network error) is written as a failed sms_logs row and swallowed
     * here, not propagated. Attendance recording must succeed regardless
     * of SMS gateway health (Phase 10's core constraint).
     */
    public function send(string $to, string $message, int $schoolId, ?int $relatedAttendanceRecordId = null): void;

    /**
     * @return array{credits_available: int, credits_consumed: int}
     */
    public function getCredits(): array;
}
