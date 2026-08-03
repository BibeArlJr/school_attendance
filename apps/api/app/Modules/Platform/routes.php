<?php

use App\Modules\Platform\Http\Controllers\AuditLogController;
use App\Modules\Platform\Http\Controllers\PlatformSchoolController;
use Illuminate\Support\Facades\Route;

// platform-admin (super_admin only, checked directly against the role —
// NOT config/modules.php-generated, since this sits above the per-school
// module matrix entirely, not inside it). Prompt 24.
Route::middleware(['auth:sanctum', 'can:platform-admin'])->prefix('platform')->group(function () {
    Route::get('/schools', [PlatformSchoolController::class, 'index']);
    Route::post('/schools', [PlatformSchoolController::class, 'store']);
    Route::get('/schools/{school}', [PlatformSchoolController::class, 'show']);
    Route::post('/schools/{school}/activate-subscription', [PlatformSchoolController::class, 'activateSubscription']);
    Route::put('/schools/{school}/subscription-expiry', [PlatformSchoolController::class, 'updateSubscriptionExpiry']);
    Route::post('/schools/{school}/cancel-subscription', [PlatformSchoolController::class, 'cancelSubscription']);
    // Prompt 35 Part E — orthogonal to the subscription actions above.
    Route::post('/schools/{school}/deactivate', [PlatformSchoolController::class, 'deactivate']);
    Route::post('/schools/{school}/reactivate', [PlatformSchoolController::class, 'reactivate']);
    // Real delete — see PlatformSchoolService::destroy()'s docblock for
    // the two gates guarding this (must already be deactivated, must
    // have zero real students/staff).
    Route::delete('/schools/{school}', [PlatformSchoolController::class, 'destroy']);
    Route::post('/active-school', [PlatformSchoolController::class, 'setActive']);
    // Prompt 43 — same platform-admin gate, not a separate permission:
    // the audit log is platform-operator infrastructure, not a
    // per-school module.
    Route::get('/audit-log', [AuditLogController::class, 'index']);
    Route::get('/audit-log/actions', [AuditLogController::class, 'actions']);
    Route::get('/audit-log/actors', [AuditLogController::class, 'actors']);
});
