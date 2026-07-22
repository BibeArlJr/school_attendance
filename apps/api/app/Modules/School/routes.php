<?php

use App\Modules\School\Http\Controllers\ClassController;
use App\Modules\School\Http\Controllers\SchoolController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/schools/{school}', [SchoolController::class, 'show']);
});

// Classes are a sub-concern of the Students module (no separate
// class-level Gate) — reuses access-students / manage-students.
Route::middleware(['auth:sanctum', 'can:access-students'])->group(function () {
    Route::get('/classes', [ClassController::class, 'index']);
});

Route::middleware(['auth:sanctum', 'can:manage-students'])->group(function () {
    Route::post('/classes', [ClassController::class, 'store']);
    Route::put('/classes/{class}', [ClassController::class, 'update']);
});
