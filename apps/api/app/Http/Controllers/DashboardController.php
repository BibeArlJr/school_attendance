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

    public function attendanceTrend(): JsonResponse
    {
        // TODO(Phase 12): replace with real aggregation query.
        // Hardcoded demo shape only — no students exist in this phase, so
        // this can't be derived from real data yet. Saturday is forced to
        // 0/0 since Nepali schools run Sunday-Friday and are closed Saturday.
        $today = now()->startOfDay();
        $presentByWeekday = [96, 118, 112, 104, 90, 101, 0]; // Sun..Sat

        $trend = collect(range(6, 0))->map(function (int $daysAgo) use ($today, $presentByWeekday) {
            $date = $today->copy()->subDays($daysAgo);
            $isSaturday = $date->dayOfWeek === 6;

            return [
                'date' => $date->toDateString(),
                'presentCount' => $isSaturday ? 0 : $presentByWeekday[$date->dayOfWeek],
                'totalCount' => $isSaturday ? 0 : 120,
            ];
        })->values()->all();

        return ApiResponse::success($trend);
    }
}
