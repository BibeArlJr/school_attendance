<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HealthController;
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

Route::middleware(['auth:sanctum', 'can:access-dashboard'])->group(function () {
    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);
    Route::get('/dashboard/attendance-trend', [DashboardController::class, 'attendanceTrend']);
});
