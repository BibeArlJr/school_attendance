<?php

use App\Modules\Staff\Http\Controllers\StaffController;
use Illuminate\Support\Facades\Route;

// destroy (Prompt 11) is a real delete, distinct from the employment-
// status lifecycle transition — only permitted with zero attendance
// history and no current class_teacher assignment. access-staff (renamed
// from access-teachers, Prompt 34 Part D) governs both read and write
// here — no split needed (Phase 3's matrix already makes this
// admin/super_admin-only, unlike Students' teacher read-tier).
//
// URL renamed from /teachers to /staff (Prompt 34 Part D) — no redirect
// on the API side, /api/teachers simply 404s now; the frontend (the only
// real consumer) is updated in lockstep. The browser-facing /teachers
// route does redirect, see app/router/router.tsx.
Route::middleware(['auth:sanctum', 'can:access-staff'])->group(function () {
    Route::get('/staff', [StaffController::class, 'index']);
    Route::get('/staff/{staff}', [StaffController::class, 'show']);
    Route::get('/staff/{staff}/id-card', [StaffController::class, 'idCard']);
});

// Same access-staff Gate as the reads above (no read/write split, Phase
// 3's matrix already makes this admin/super_admin-only) — split into its
// own group only so license-active (Prompt 25) applies to writes without
// touching the reads above.
Route::middleware(['auth:sanctum', 'can:access-staff', 'license-active'])->group(function () {
    Route::post('/staff', [StaffController::class, 'store']);
    Route::put('/staff/{staff}', [StaffController::class, 'update']);
    Route::patch('/staff/{staff}/employment-status', [StaffController::class, 'updateEmploymentStatus']);
    Route::post('/staff/{staff}/reset-password', [StaffController::class, 'resetPassword']);
    Route::post('/staff/{staff}/id-card/reissue', [StaffController::class, 'reissueIdCard']);
    Route::delete('/staff/{staff}', [StaffController::class, 'destroy']);
});
