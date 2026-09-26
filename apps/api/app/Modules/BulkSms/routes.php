<?php

use App\Modules\BulkSms\Http\Controllers\BulkSmsContactController;
use App\Modules\BulkSms\Http\Controllers\BulkSmsCredentialController;
use App\Modules\BulkSms\Http\Controllers\BulkSmsTestSendController;
use App\Modules\BulkSms\Http\Controllers\BulkSmsUploadController;
use Illuminate\Support\Facades\Route;

// Generic bulk-SMS contact management/message-composer foundation.
// platform-admin (super_admin only, same Gate as Platform Console) —
// deliberately NOT config/modules.php-generated: this has no school to
// scope to at all, same reasoning as app/Modules/Platform/routes.php.
Route::middleware(['auth:sanctum', 'can:platform-admin'])->prefix('bulk-sms')->group(function () {
    Route::get('/contacts', [BulkSmsContactController::class, 'index']);
    Route::post('/contacts', [BulkSmsContactController::class, 'store']);
    Route::put('/contacts/{bulkSmsContact}', [BulkSmsContactController::class, 'update']);
    Route::delete('/contacts/{bulkSmsContact}', [BulkSmsContactController::class, 'destroy']);

    // Registered before no {param} routes exist here to conflict with,
    // but kept as literal, non-parameterized paths anyway (not
    // '/uploads/{action}') — same ordering-hazard avoidance already
    // established elsewhere in this codebase (e.g. SMS templates'
    // platform/{type} vs {type}).
    Route::post('/uploads/preview', [BulkSmsUploadController::class, 'preview']);
    Route::post('/uploads/confirm', [BulkSmsUploadController::class, 'confirm']);
    Route::get('/uploads', [BulkSmsUploadController::class, 'index']);

    // Stage 2 — the module's own, separate Sparrow credential. Never
    // App\Modules\Sms\Models\SmsProviderConfig.
    Route::get('/credential', [BulkSmsCredentialController::class, 'show']);
    Route::put('/credential', [BulkSmsCredentialController::class, 'update']);
    // "Check Connection" and "Check Credits" both hit this same
    // read-only endpoint — neither ever sends an SMS.
    Route::get('/credential/credits', [BulkSmsCredentialController::class, 'credits']);

    // Stage 2's single-recipient test-send — deliberately the ONLY
    // sending code path this module has. Accepts one scalar phone
    // number (TestSendBulkSmsRequest enforces this), never a
    // contact/upload id or a "send all" flag. See
    // BulkSmsTestSendService's own docblock for the full safety
    // boundary — this is NOT Stage 3 (bulk/campaign sending), which
    // does not exist anywhere in this codebase.
    Route::post('/test-send', [BulkSmsTestSendController::class, 'store']);
});
