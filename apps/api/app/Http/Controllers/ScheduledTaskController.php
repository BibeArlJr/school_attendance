<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Support\Enums\UserRole;
use App\Support\Responses\ApiResponse;
use App\Support\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Str;

/**
 * POST /api/tasks/* (Prompt 55 Part E) — triggered by an external
 * cron-ping service or a GitHub Actions scheduled workflow, standing in
 * for Render's Cron Jobs (not free-tier eligible). Every action here is
 * guarded by VerifyScheduledTaskSecret rather than auth:sanctum — the
 * caller is an external trigger (or, for resetSuperAdminPassword, an
 * operator with no other way in), not a logged-in user.
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

    /**
     * Standing recovery mechanism (not a one-off script) for the exact
     * lockout scenario Render's free tier makes otherwise unrecoverable:
     * the super_admin password was only ever shown once, in deploy logs
     * (CreateSuperAdmin), and there's no Shell to reset it by hand.
     * Deliberately NOT run automatically at boot (unlike
     * CreateSuperAdmin itself) — resetting a real password on every
     * redeploy would be a standing security hole, not a recovery tool.
     * Requires the same shared secret as every other /api/tasks/*
     * endpoint (VerifyScheduledTaskSecret) — safe to return the new
     * password directly in the response, since only a caller who
     * already holds that secret ever sees it.
     */
    public function resetSuperAdminPassword(): JsonResponse
    {
        $superAdmins = User::query()->where('role', UserRole::SuperAdmin)->get();

        if ($superAdmins->isEmpty()) {
            return ApiResponse::error('No super_admin account exists to reset.', null, 404);
        }

        // CreateSuperAdmin's own guard means there should only ever be
        // one — if that's somehow no longer true, resetting the wrong
        // one silently would be worse than just refusing and asking for
        // this to be resolved deliberately instead of guessed at.
        if ($superAdmins->count() > 1) {
            return ApiResponse::error(
                'More than one super_admin account exists — refusing to guess which one to reset.',
                ['emails' => $superAdmins->pluck('email')],
                409,
            );
        }

        $superAdmin = $superAdmins->first();
        $newPassword = Str::password(20);
        $superAdmin->update(['password' => $newPassword]);

        app(AuditLogger::class)->log(
            'user.super_admin_password_reset',
            'user',
            $superAdmin->id,
            null,
            null,
            null,
        );

        return ApiResponse::success([
            'email' => $superAdmin->email,
            'password' => $newPassword,
        ], 'Super admin password reset. Store this password now — it will not be shown again.');
    }
}
