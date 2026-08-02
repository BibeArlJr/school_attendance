<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HealthController;
use App\Http\Controllers\ScheduledTaskController;
use App\Http\Middleware\VerifyScheduledTaskSecret;
use Illuminate\Support\Facades\Route;

// Module routes (app/Modules/*/routes.php) are autoloaded by
// App\Providers\ModuleRouteServiceProvider — nothing to require here.

// No auth — an external uptime monitor polls this, not an authenticated
// app feature (Prompt 45). Distinct from the built-in GET /up, which
// never checks the database.
//
// Explicitly stripped of the api group's throttle:api middleware: this
// app's rate limiter uses the database cache store (CACHE_STORE=database),
// so with the DB genuinely down, ThrottleRequests itself throws an
// uncaught QueryException trying to read the rate-limit counter — a raw
// 500 from middleware, before HealthController's own try/catch ever
// runs, defeating the entire "report clearly which check failed" point.
// A monitor polling this frequently must also never get throttled into
// a false "down" reading.
Route::get('/health', [HealthController::class, 'index'])
    ->withoutMiddleware('throttle:api');

// External cron-ping / GitHub Actions trigger (Prompt 55 Part E) —
// stands in for Render's Cron Jobs, which aren't free-tier eligible.
// Shared-secret guarded (VerifyScheduledTaskSecret), not session/token
// auth — the caller is an external scheduler, not a logged-in user.
Route::post('/tasks/send-license-reminders', [ScheduledTaskController::class, 'sendLicenseReminders'])
    ->middleware(VerifyScheduledTaskSecret::class);

// Standing recovery path for a locked-out super_admin on a Shell-less
// tier — same secret, same middleware, not a one-time script (see the
// controller method's own docblock for why this isn't run at boot).
Route::post('/tasks/reset-super-admin-password', [ScheduledTaskController::class, 'resetSuperAdminPassword'])
    ->middleware(VerifyScheduledTaskSecret::class);

Route::middleware(['auth:sanctum', 'can:access-dashboard'])->group(function () {
    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);
    Route::get('/dashboard/attendance-trend', [DashboardController::class, 'attendanceTrend']);
});
