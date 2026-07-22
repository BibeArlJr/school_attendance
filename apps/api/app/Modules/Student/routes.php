<?php

use App\Modules\Student\Http\Controllers\StudentController;
use Illuminate\Support\Facades\Route;

// No destroy route exists anywhere for students in this phase — status
// changes (active/inactive/transferred/alumni) are the only lifecycle
// transition, via PATCH .../status.

Route::middleware(['auth:sanctum', 'can:access-students'])->group(function () {
    Route::get('/students', [StudentController::class, 'index']);
    Route::get('/students/{student}', [StudentController::class, 'show']);
});

Route::middleware(['auth:sanctum', 'can:manage-students'])->group(function () {
    Route::post('/students', [StudentController::class, 'store']);
    Route::put('/students/{student}', [StudentController::class, 'update']);
    Route::patch('/students/{student}/status', [StudentController::class, 'updateStatus']);
});
