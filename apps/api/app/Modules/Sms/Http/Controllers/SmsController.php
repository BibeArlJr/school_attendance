<?php

namespace App\Modules\Sms\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Resources\SmsLogResource;
use App\Modules\Sms\Models\SmsLog;
use App\Support\Contracts\SmsServiceInterface;
use App\Support\Responses\ApiResponse;
use App\Support\Services\CurrentSchoolResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SmsController extends Controller
{
    public function __construct(
        private readonly SmsServiceInterface $smsService,
        private readonly CurrentSchoolResolver $schoolResolver,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $schoolId = $this->schoolResolver->resolve($request->user());

        // Eager-loaded so SmsLogResource's student link (Prompt 36 Part A)
        // never N+1s across a page of results.
        $query = SmsLog::query()->where('school_id', $schoolId)->with('relatedAttendanceRecord.owner');

        if ($search = trim((string) $request->query('search', ''))) {
            $query->where('recipient_phone', 'ilike', "%{$search}%");
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $logs = $query
            ->orderByDesc('sent_at')
            ->paginate((int) $request->query('per_page', 15))
            ->withQueryString();

        return ApiResponse::success(
            $logs->setCollection($logs->getCollection()->map(fn (SmsLog $log) => new SmsLogResource($log))),
        );
    }

    public function credits(): JsonResponse
    {
        return ApiResponse::success([
            ...$this->smsService->getCredits(),
            'driver' => config('services.sms.driver'),
        ]);
    }
}
