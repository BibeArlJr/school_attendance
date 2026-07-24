<?php

use App\Modules\Platform\Http\Controllers\PlatformSchoolController;
use Illuminate\Support\Facades\Route;

// platform-admin (super_admin only, checked directly against the role —
// NOT config/modules.php-generated, since this sits above the per-school
// module matrix entirely, not inside it). Prompt 24.
Route::middleware(['auth:sanctum', 'can:platform-admin'])->prefix('platform')->group(function () {
    Route::get('/schools', [PlatformSchoolController::class, 'index']);
    Route::post('/schools', [PlatformSchoolController::class, 'store']);
    Route::get('/schools/{school}', [PlatformSchoolController::class, 'show']);
    Route::post('/active-school', [PlatformSchoolController::class, 'setActive']);
});
