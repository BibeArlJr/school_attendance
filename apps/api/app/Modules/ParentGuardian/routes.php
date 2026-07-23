<?php

use App\Modules\ParentGuardian\Http\Controllers\ParentGuardianController;
use App\Modules\ParentGuardian\Http\Controllers\StudentGuardianController;
use Illuminate\Support\Facades\Route;

// destroy (Prompt 11) is a real delete for parent_guardians — only
// permitted with zero student_parent_links (unlink first, via
// StudentGuardianController::destroy below). Distinct from unlinking:
// unlink removes one association; destroy removes the record entirely,
// and is blocked while any association still exists.
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
    Route::delete('/parents/{parent}', [ParentGuardianController::class, 'destroy']);

    Route::get('/students/{student}/parents', [StudentGuardianController::class, 'index']);
    Route::post('/students/{student}/parents', [StudentGuardianController::class, 'store']);
    Route::delete('/students/{student}/parents/{parent}', [StudentGuardianController::class, 'destroy']);
});
