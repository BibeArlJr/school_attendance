<?php

use App\Modules\Student\Http\Controllers\StudentController;
use Illuminate\Support\Facades\Route;

// Status changes (active/inactive/transferred/alumni) remain the normal
// lifecycle transition. destroy (Prompt 11) is a distinct, rarer action —
// a real delete, only permitted with zero attendance history — for
// records added by mistake, not for students who actually left.

Route::middleware(['auth:sanctum', 'can:access-students'])->group(function () {
    Route::get('/students', [StudentController::class, 'index']);
    Route::get('/students/{student}', [StudentController::class, 'show']);
});

Route::middleware(['auth:sanctum', 'can:manage-students'])->group(function () {
    Route::post('/students', [StudentController::class, 'store']);
    Route::put('/students/{student}', [StudentController::class, 'update']);
    Route::patch('/students/{student}/status', [StudentController::class, 'updateStatus']);
    Route::delete('/students/{student}', [StudentController::class, 'destroy']);
});
