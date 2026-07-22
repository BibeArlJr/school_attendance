<?php

use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;

// Module routes (app/Modules/*/routes.php) are autoloaded by
// App\Providers\ModuleRouteServiceProvider — nothing to require here.

Route::middleware('auth:sanctum')->get('/dashboard/summary', [DashboardController::class, 'summary']);
