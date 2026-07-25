<?php

use App\Modules\Settings\Http\Controllers\SettingsCalendarController;
use App\Modules\Settings\Http\Controllers\SettingsController;
use Illuminate\Support\Facades\Route;

// access-settings (config-generated from config/modules.php's settings
// entry: super_admin/admin only, no teacher/guard) — no new Gate, per
// Prompt 23's architecture constraint. Read and write share the same
// Gate here (unlike Students' access/manage split) since both roles
// allowed to view Settings are also allowed to change it.
Route::middleware(['auth:sanctum', 'can:access-settings'])->group(function () {
    Route::get('/settings/school', [SettingsController::class, 'school']);
    Route::put('/settings/school', [SettingsController::class, 'updateSchool']);
    Route::post('/settings/school/logo', [SettingsController::class, 'uploadLogo']);

    Route::get('/settings/attendance-config', [SettingsController::class, 'attendanceConfig']);
    Route::put('/settings/attendance-config', [SettingsController::class, 'updateAttendanceConfig']);

    Route::get('/settings/academic-year', [SettingsController::class, 'academicYear']);
    Route::get('/settings/license', [SettingsController::class, 'license']);

    Route::get('/settings/calendar', [SettingsCalendarController::class, 'index']);
    Route::post('/settings/calendar', [SettingsCalendarController::class, 'store']);
    // Registered before the {schoolCalendar} routes below so "range" is
    // never captured as a route-model-binding id.
    Route::post('/settings/calendar/range', [SettingsCalendarController::class, 'storeRange']);
    Route::put('/settings/calendar/{schoolCalendar}', [SettingsCalendarController::class, 'update']);
    Route::delete('/settings/calendar/{schoolCalendar}', [SettingsCalendarController::class, 'destroy']);
});
