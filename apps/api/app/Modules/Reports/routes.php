<?php

use App\Modules\Reports\Http\Controllers\ReportController;
use Illuminate\Support\Facades\Route;

// access-reports (config-generated from config/modules.php's reports
// entry: super_admin/admin/teacher, no guard) — no new Gate, per Prompt
// 21's architecture constraint. Read-only reports, so no manage-* split.
Route::middleware(['auth:sanctum', 'can:access-reports'])->group(function () {
    Route::get('/reports/attendance-summary', [ReportController::class, 'attendanceSummary']);
    Route::get('/reports/enrollment-summary', [ReportController::class, 'enrollmentSummary']);
});
