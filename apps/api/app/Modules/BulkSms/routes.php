<?php

use App\Modules\BulkSms\Http\Controllers\BulkSmsContactController;
use App\Modules\BulkSms\Http\Controllers\BulkSmsUploadController;
use Illuminate\Support\Facades\Route;

// Generic bulk-SMS contact management/message-composer foundation.
// platform-admin (super_admin only, same Gate as Platform Console) —
// deliberately NOT config/modules.php-generated: this has no school to
// scope to at all, same reasoning as app/Modules/Platform/routes.php.
// No Sparrow integration, no credential storage, and no actual sending
// exist in this module yet — see BulkSmsUploadService/
// BulkSmsContactService docblocks.
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
});
