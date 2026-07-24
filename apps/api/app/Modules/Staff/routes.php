<?php

use App\Modules\Staff\Http\Controllers\StaffController;
use Illuminate\Support\Facades\Route;

// destroy (Prompt 11) is a real delete, distinct from the employment-
// status lifecycle transition — only permitted with zero attendance
// history and no current class_teacher assignment. access-teachers
// governs both read and write here — no split needed (Phase 3's matrix
// already makes Teachers admin/super_admin-only, unlike Students'
// teacher read-tier).
Route::middleware(['auth:sanctum', 'can:access-teachers'])->group(function () {
    Route::get('/teachers', [StaffController::class, 'index']);
    Route::get('/teachers/{staff}', [StaffController::class, 'show']);
    Route::get('/teachers/{staff}/id-card', [StaffController::class, 'idCard']);
});

// Same access-teachers Gate as the reads above (no read/write split,
// Phase 3's matrix already makes this admin/super_admin-only) — split
// into its own group only so license-active (Prompt 25) applies to
// writes without touching the reads above.
Route::middleware(['auth:sanctum', 'can:access-teachers', 'license-active'])->group(function () {
    Route::post('/teachers', [StaffController::class, 'store']);
    Route::put('/teachers/{staff}', [StaffController::class, 'update']);
    Route::patch('/teachers/{staff}/employment-status', [StaffController::class, 'updateEmploymentStatus']);
    Route::post('/teachers/{staff}/reset-password', [StaffController::class, 'resetPassword']);
    Route::post('/teachers/{staff}/id-card/reissue', [StaffController::class, 'reissueIdCard']);
    Route::delete('/teachers/{staff}', [StaffController::class, 'destroy']);
});
