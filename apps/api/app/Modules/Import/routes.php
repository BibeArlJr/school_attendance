<?php

use App\Modules\Import\Http\Controllers\StudentImportController;
use Illuminate\Support\Facades\Route;

// Same manage-students Gate as the rest of student creation (Phase 4) —
// no new Gate, per Prompt 9's architecture constraint.
Route::middleware(['auth:sanctum', 'can:manage-students'])->group(function () {
    Route::post('/students/import', [StudentImportController::class, 'store']);
    Route::get('/students/import/{batch}', [StudentImportController::class, 'show']);
    Route::post('/students/import/{batch}/commit', [StudentImportController::class, 'commit']);
});
