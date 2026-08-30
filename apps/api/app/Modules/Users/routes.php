<?php

use App\Modules\Users\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

// destroy is a real delete, distinct from the employment-status
// lifecycle transition — no attendance-history/class_teacher guard
// applies here anymore (Prompt: Rebuild Staff Module) — a login
// account never carries attendance history in the first place.
// access-users (renamed from access-staff, same prompt — the module
// key itself changed since "staff" now names a different, unrelated
// domain concept) governs both read and write here — no split needed.
//
// URL renamed from /staff to /users — no redirect on the API side,
// /api/staff now serves the NEW staff (HR/personnel) module instead
// (see App\Modules\Staff\routes.php), not a 404 and not this
// controller. The browser-facing /staff route redirects to /users,
// see app/router/router.tsx — same pattern as the earlier /teachers ->
// /staff rename.
Route::middleware(['auth:sanctum', 'can:access-users'])->group(function () {
    Route::get('/users', [UserController::class, 'index']);
    Route::get('/users/{userAccount}', [UserController::class, 'show']);
});

// Same access-users Gate as the reads above (no read/write split) —
// split into its own group only so license-active applies to writes
// without touching the reads above.
Route::middleware(['auth:sanctum', 'can:access-users', 'license-active'])->group(function () {
    Route::post('/users', [UserController::class, 'store']);
    Route::put('/users/{userAccount}', [UserController::class, 'update']);
    Route::patch('/users/{userAccount}/employment-status', [UserController::class, 'updateEmploymentStatus']);
    Route::post('/users/{userAccount}/reset-password', [UserController::class, 'resetPassword']);
    Route::delete('/users/{userAccount}', [UserController::class, 'destroy']);
});
