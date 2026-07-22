<?php

use App\Modules\ParentGuardian\Http\Controllers\ParentGuardianController;
use App\Modules\ParentGuardian\Http\Controllers\StudentGuardianController;
use Illuminate\Support\Facades\Route;

// No destroy route exists for parent_guardians in this phase (real people,
// no-hard-delete convention) — only student_parent_links rows are ever
// deleted, via StudentGuardianController::destroy below.
//
// access-parents has no read/write split (unlike Students' manage-students):
// Phase 3's matrix already makes this binary — admin/super_admin or
// nothing — so every route in this file shares one Gate.
Route::middleware(['auth:sanctum', 'can:access-parents'])->group(function () {
    Route::get('/parents/search', [ParentGuardianController::class, 'search']);
    Route::get('/parents', [ParentGuardianController::class, 'index']);
    Route::get('/parents/{parent}', [ParentGuardianController::class, 'show']);
    Route::post('/parents', [ParentGuardianController::class, 'store']);
    Route::put('/parents/{parent}', [ParentGuardianController::class, 'update']);

    Route::get('/students/{student}/parents', [StudentGuardianController::class, 'index']);
    Route::post('/students/{student}/parents', [StudentGuardianController::class, 'store']);
    Route::delete('/students/{student}/parents/{parent}', [StudentGuardianController::class, 'destroy']);
});
