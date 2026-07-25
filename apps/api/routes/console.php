<?php

use App\Console\Commands\SendLicenseReminders;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Prompt 33 Part A — daily is enough resolution for day-granularity
// thresholds; withoutOverlapping guards against a slow run still going
// when the next day's fires. Requires a real cron entry pointing at
// `php artisan schedule:run` every minute — see README's "Scheduled
// jobs" section for the exact crontab line, this is new infrastructure
// for this project (nothing was scheduled before this phase).
Schedule::command(SendLicenseReminders::class)->daily()->withoutOverlapping();
