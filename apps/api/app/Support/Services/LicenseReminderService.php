<?php

namespace App\Support\Services;

use App\Modules\School\Models\School;
use App\Support\Contracts\SmsServiceInterface;
use App\Support\Enums\UserRole;
use Illuminate\Support\Facades\Log;

/**
 * Prompt 33 Part A/B — daily-cron-driven license expiry reminders.
 * Checked independently per threshold so a school that hasn't been
 * processed in a while (scheduler downtime) still gets every threshold
 * it's already inside, each exactly once, rather than only the nearest one.
 */
class LicenseReminderService
{
    private const THRESHOLDS_DAYS = [30, 15, 7];

    public function __construct(private readonly SmsServiceInterface $smsService)
    {
    }

    /**
     * @return int how many reminder SMS were actually sent for this school (0+)
     */
    public function processSchool(School $school): int
    {
        $daysRemaining = $school->daysUntilExpiry();

        if ($daysRemaining === null) {
            return 0;
        }

        $sentCount = 0;

        foreach (self::THRESHOLDS_DAYS as $threshold) {
            if ($daysRemaining > $threshold) {
                continue;
            }

            $column = $school->reminderColumn($threshold);
            if ($school->{$column} !== null) {
                continue;
            }

            $sentCount += $this->sendReminder($school, $threshold, $daysRemaining);
            $school->{$column} = now();
        }

        if ($sentCount > 0 || $school->isDirty()) {
            $school->save();
        }

        return $sentCount;
    }

    /**
     * @return int how many admin phones this threshold's SMS actually went to
     */
    private function sendReminder(School $school, int $thresholdDays, int $daysRemaining): int
    {
        $admins = $school->users()
            ->where('role', UserRole::Admin)
            ->whereNotNull('phone')
            ->get();

        if ($admins->isEmpty()) {
            Log::warning("License reminder ({$thresholdDays}-day) for school #{$school->id} ({$school->name}): no admin with a phone on file, SMS skipped.");

            return 0;
        }

        $message = $this->messageFor($school, $thresholdDays, $daysRemaining);

        foreach ($admins as $admin) {
            $this->smsService->send($admin->phone, $message, $school->id);
        }

        return $admins->count();
    }

    /**
     * Three distinct templates, escalating urgency — deliberately not the
     * parent attendance-notification wording (Prompt 33 Part B).
     */
    private function messageFor(School $school, int $thresholdDays, int $daysRemaining): string
    {
        return match ($thresholdDays) {
            30 => "Dear Admin, {$school->name}'s School ERP subscription expires in {$daysRemaining} day(s). "
                . 'Please plan your renewal to avoid any interruption.',
            15 => "Reminder: {$school->name}'s School ERP subscription expires in {$daysRemaining} day(s). "
                . 'Please renew soon — write access will be blocked once it expires.',
            default => "Urgent: {$school->name}'s School ERP subscription expires in {$daysRemaining} day(s). "
                . 'Renew immediately — gate scanning, SMS alerts, and record edits will stop working once it expires.',
        };
    }
}
