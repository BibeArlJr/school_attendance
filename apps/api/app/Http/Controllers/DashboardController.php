<?php

namespace App\Http\Controllers;

use App\Support\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function summary(): JsonResponse
    {
        // TODO(Phase 12): replace with real aggregation query
        return ApiResponse::success([
            'total_students' => 0,
            'total_teachers' => 0,
            'present_today' => 0,
            'sms_sent_today' => 0,
        ]);
    }
}
