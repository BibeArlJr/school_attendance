<?php

use App\Modules\Attendance\Http\Controllers\AttendanceController;
use App\Modules\Attendance\Http\Controllers\GateScannerController;
use Illuminate\Support\Facades\Route;

// attendance_events is append-only: no update/delete route exists for it
// anywhere, ever — reviewing an anomaly (below) only ever touches
// reviewed_by/reviewed_at/needs_review/review_note, never what was
// actually scanned.
Route::middleware(['auth:sanctum', 'can:access-gate-scanner'])->group(function () {
    Route::post('/gate-scanner/scan', [GateScannerController::class, 'scan']);
});

Route::middleware(['auth:sanctum', 'can:access-attendance'])->group(function () {
    Route::get('/attendance', [AttendanceController::class, 'index']);
    Route::get('/attendance/anomalies', [AttendanceController::class, 'anomalies']);
    Route::get('/attendance/recent-events', [AttendanceController::class, 'recentEvents']);
    Route::get('/students/{student}/attendance-calendar', [AttendanceController::class, 'studentCalendar']);
    Route::get('/students/{student}/attendance-summary', [AttendanceController::class, 'studentSummary']);
});

Route::middleware(['auth:sanctum', 'can:manage-attendance'])->group(function () {
    Route::patch('/attendance-events/{attendanceEvent}/review', [AttendanceController::class, 'reviewEvent']);
    Route::patch('/attendance-records/{attendanceRecord}', [AttendanceController::class, 'updateRecord']);
});
