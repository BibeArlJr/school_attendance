<?php

namespace App\Modules\School\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\School\Models\School;
use App\Support\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;

class SchoolController extends Controller
{
    public function show(School $school): JsonResponse
    {
        return ApiResponse::success($school);
    }
}
