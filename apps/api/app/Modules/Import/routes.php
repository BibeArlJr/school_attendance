<?php

use App\Modules\Import\Http\Controllers\StudentImportController;
use Illuminate\Support\Facades\Route;

// Same manage-students Gate as the rest of student creation (Phase 4) —
// no new Gate, per Prompt 9's architecture constraint.
Route::middleware(['auth:sanctum', 'can:manage-students'])->group(function () {
    // Viewing a batch's parsed rows/errors is read-only — stays available
    // when expired; the two routes that actually write students don't.
    Route::get('/students/import/{batch}', [StudentImportController::class, 'show']);

    Route::middleware('license-active')->group(function () {
        Route::post('/students/import', [StudentImportController::class, 'store']);
        Route::post('/students/import/{batch}/commit', [StudentImportController::class, 'commit']);
    });
});
