<?php

use App\Modules\Sms\Http\Controllers\SmsController;
use Illuminate\Support\Facades\Route;

// access-sms-log (config-generated from config/modules.php's sms-log
// entry, super_admin/admin only) — no new Gate, per Prompt 10's
// architecture constraint.
Route::middleware(['auth:sanctum', 'can:access-sms-log'])->group(function () {
    Route::get('/sms-logs', [SmsController::class, 'index']);
    Route::get('/sms/credits', [SmsController::class, 'credits']);
});
