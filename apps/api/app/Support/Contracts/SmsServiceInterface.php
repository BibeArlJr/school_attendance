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
    public function send(string $to, string $message): void;
}
