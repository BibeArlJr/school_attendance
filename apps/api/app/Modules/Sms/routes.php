<?php

use App\Modules\Sms\Http\Controllers\SmsController;
use App\Modules\Sms\Http\Controllers\SmsTemplateController;
use Illuminate\Support\Facades\Route;

// access-sms-log (config-generated from config/modules.php's sms-log
// entry, super_admin/admin only) — no new Gate, per Prompt 10's
// architecture constraint.
Route::middleware(['auth:sanctum', 'can:access-sms-log'])->group(function () {
    Route::get('/sms-logs', [SmsController::class, 'index']);
    Route::get('/sms/credits', [SmsController::class, 'credits']);
});

// SMS message templates (Prompt 50) — surfaced under /settings in the
// frontend (a new Settings tab), same access-settings Gate as the rest
// of Settings, even though this controller lives in the Sms module
// (same cross-module URL-vs-controller-home split StudentGuardianController
// already established for /students/{student}/parents).
Route::middleware(['auth:sanctum', 'can:access-settings'])->group(function () {
    Route::get('/settings/sms-templates', [SmsTemplateController::class, 'index']);
});

// Registered BEFORE the {type} route below — otherwise "platform" would
// itself be captured as a {type} route parameter and fail enum binding
// (404) rather than ever reaching this route.
Route::middleware(['auth:sanctum', 'can:platform-admin'])->group(function () {
    Route::put('/settings/sms-templates/platform/{type}', [SmsTemplateController::class, 'updatePlatformDefault']);
});

Route::middleware(['auth:sanctum', 'can:access-settings', 'license-active'])->group(function () {
    Route::put('/settings/sms-templates/{type}', [SmsTemplateController::class, 'update']);
});
