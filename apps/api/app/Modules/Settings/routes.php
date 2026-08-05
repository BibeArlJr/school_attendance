<?php

use App\Modules\Settings\Http\Controllers\SettingsCalendarController;
use App\Modules\Settings\Http\Controllers\SettingsController;
use Illuminate\Support\Facades\Route;

// Public, unauthenticated — a browser requests this as a plain
// <img src>, which can't carry an auth header (see
// SettingsController::showLogo()'s own docblock for why this proxies
// through the app instead of a direct B2 URL). {schoolId} constrained
// to digits so a malformed value 404s cleanly instead of a raw
// TypeError from the int-typed controller parameter. Exempted from
// throttle:api (same reasoning as /health) — this fires incidentally on
// every page load (topbar logo, ID cards) sharing one IP-keyed budget
// with every other unauthenticated request; a busy school's shared
// network shouldn't be able to exhaust real API calls' rate limit just
// by loading a logo image repeatedly. Aggressive Cache-Control on the
// response (see showLogo()) means the browser rarely re-requests it
// anyway.
Route::get('/logos/{schoolId}/{filename}', [SettingsController::class, 'showLogo'])
    ->where('schoolId', '[0-9]+')
    ->withoutMiddleware('throttle:api')
    ->name('logos.show');

// access-settings (config-generated from config/modules.php's settings
// entry: super_admin/admin only, no teacher/guard) — no new Gate, per
// Prompt 23's architecture constraint. Read and write share the same
// Gate here (unlike Students' access/manage split) since both roles
// allowed to view Settings are also allowed to change it.
Route::middleware(['auth:sanctum', 'can:access-settings'])->group(function () {
    Route::get('/settings/school', [SettingsController::class, 'school']);
    Route::get('/settings/attendance-config', [SettingsController::class, 'attendanceConfig']);
    Route::get('/settings/academic-year', [SettingsController::class, 'academicYear']);
    // Deliberately NOT license-active: this is exactly the page an admin
    // needs to reach to see days-remaining/expiry and act on it — the one
    // Settings sub-page that must stay reachable even when expired.
    Route::get('/settings/license', [SettingsController::class, 'license']);
    Route::get('/settings/calendar', [SettingsCalendarController::class, 'index']);

    // Every write route below (Prompt 33 Part C: "settings changes" is
    // one of the explicitly blocked-when-expired actions).
    Route::middleware('license-active')->group(function () {
        Route::put('/settings/school', [SettingsController::class, 'updateSchool']);
        Route::post('/settings/school/logo', [SettingsController::class, 'uploadLogo']);
        Route::put('/settings/attendance-config', [SettingsController::class, 'updateAttendanceConfig']);

        Route::post('/settings/calendar', [SettingsCalendarController::class, 'store']);
        // Registered before the {schoolCalendar} routes below so "range" is
        // never captured as a route-model-binding id.
        Route::post('/settings/calendar/range', [SettingsCalendarController::class, 'storeRange']);
        Route::put('/settings/calendar/{schoolCalendar}', [SettingsCalendarController::class, 'update']);
        Route::delete('/settings/calendar/{schoolCalendar}', [SettingsCalendarController::class, 'destroy']);
    });
});
