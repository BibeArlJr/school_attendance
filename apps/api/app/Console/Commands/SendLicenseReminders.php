<?php

namespace App\Console\Commands;

use App\Modules\School\Models\School;
use App\Support\Services\LicenseReminderService;
use Illuminate\Console\Command;

class SendLicenseReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:send-license-reminders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send 30/15/7-day license expiry SMS reminders to school admins (Prompt 33 Part A), once per threshold per license period.';

    /**
     * Execute the console command.
     */
    public function handle(LicenseReminderService $reminders): int
    {
        // amc_expiry_date null = never activated = permanently Active
        // (School::licenseStatus()) — nothing to remind about.
        $schools = School::query()->whereNotNull('amc_expiry_date')->get();

        $totalSent = 0;
        foreach ($schools as $school) {
            $totalSent += $reminders->processSchool($school);
        }

        $this->info("Checked {$schools->count()} school(s) with an active license period, sent {$totalSent} reminder SMS.");

        return self::SUCCESS;
    }
}
