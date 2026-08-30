<?php

use App\Modules\Staff\Http\Controllers\StaffController;
use App\Modules\Staff\Http\Controllers\StaffImportController;
use Illuminate\Support\Facades\Route;

// New HR-domain personnel module — access-staff (config-generated,
// admin/super_admin only, same single-Gate tier as Parents: no
// read/write split, matching the sensitivity of the personal data
// involved). Genuinely independent of access-users (App\Modules\Users)
// — this is real employee data, not login accounts.
Route::middleware(['auth:sanctum', 'can:access-staff'])->group(function () {
    Route::get('/staff', [StaffController::class, 'index']);

    // Registered BEFORE /staff/{staff} below — otherwise "import" would
    // itself be captured as the {staff} route parameter and fail UUID
    // binding (404) rather than ever reaching these routes. Same
    // ordering hazard already solved this way for /settings/sms-templates
    // /platform/{type} vs /settings/sms-templates/{type}.
    Route::get('/staff/import/{batch}', [StaffImportController::class, 'show']);

    Route::get('/staff/{staff}', [StaffController::class, 'show']);
    Route::get('/staff/{staff}/id-card', [StaffController::class, 'idCard']);

    Route::middleware('license-active')->group(function () {
        Route::post('/staff/import', [StaffImportController::class, 'store']);
        Route::post('/staff/import/{batch}/commit', [StaffImportController::class, 'commit']);

        Route::post('/staff', [StaffController::class, 'store']);
        Route::put('/staff/{staff}', [StaffController::class, 'update']);
        Route::patch('/staff/{staff}/employment-status', [StaffController::class, 'updateEmploymentStatus']);
        Route::post('/staff/{staff}/id-card/reissue', [StaffController::class, 'reissueIdCard']);
        Route::delete('/staff/{staff}', [StaffController::class, 'destroy']);
    });
});
