<?php

use App\Modules\IdCard\Http\Controllers\IdCardController;
use Illuminate\Support\Facades\Route;

// No destroy route exists for id_cards — a lost/damaged card is replaced
// via reissue (deactivate + generate new), never deleted.
//
// Sub-concern of Students (same as Classes in Phase 4): reuses
// access-students for read and manage-students for write, no new Gate.
Route::middleware(['auth:sanctum', 'can:access-students'])->group(function () {
    Route::get('/id-cards', [IdCardController::class, 'index']);
    Route::get('/students/{student}/id-card', [IdCardController::class, 'show']);
});

Route::middleware(['auth:sanctum', 'can:manage-students'])->group(function () {
    Route::post('/students/{student}/id-card/reissue', [IdCardController::class, 'reissue']);
});
