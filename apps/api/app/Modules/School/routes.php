<?php

use App\Modules\School\Http\Controllers\SchoolController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/schools/{school}', [SchoolController::class, 'show']);
});
