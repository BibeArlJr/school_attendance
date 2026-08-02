<?php

namespace App\Http\Controllers;

use App\Support\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Artisan;

/**
 * POST /api/tasks/* (Prompt 55 Part E) — triggered by an external
 * cron-ping service or a GitHub Actions scheduled workflow, standing in
 * for Render's Cron Jobs (not free-tier eligible). Every action here
 * wraps a command that already exists and is already safe to run
 * repeatedly (SendLicenseReminders is idempotent per threshold per
 * license period) — this controller adds no new business logic, only an
 * HTTP-triggerable entry point guarded by VerifyScheduledTaskSecret.
 */
class ScheduledTaskController extends Controller
{
    public function sendLicenseReminders(): JsonResponse
    {
        $exitCode = Artisan::call('app:send-license-reminders');

        return ApiResponse::success(
            ['output' => trim(Artisan::output())],
            'Command executed.',
            $exitCode === 0 ? 200 : 500,
        );
    }
}
