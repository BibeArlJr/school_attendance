<?php

use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;

// Module routes (app/Modules/*/routes.php) are autoloaded by
// App\Providers\ModuleRouteServiceProvider — nothing to require here.

Route::middleware(['auth:sanctum', 'can:access-dashboard'])->group(function () {
    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);
    Route::get('/dashboard/attendance-trend', [DashboardController::class, 'attendanceTrend']);
});
