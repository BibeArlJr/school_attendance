<?php

namespace App\Modules\Attendance\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Attendance\Http\Requests\ScanRequest;
use App\Modules\Attendance\Models\SchoolCalendar;
use App\Modules\Attendance\Services\AttendanceService;
use App\Modules\Attendance\Services\ScanOutcome;
use App\Support\Responses\ApiResponse;
use App\Support\Services\CurrentSchoolResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GateScannerController extends Controller
{
    public function __construct(
        private readonly AttendanceService $attendanceService,
        private readonly CurrentSchoolResolver $schoolResolver,
    ) {
    }

    public function scan(ScanRequest $request): JsonResponse
    {
        $schoolId = $this->schoolResolver->resolve($request->user());

        $outcome = $this->attendanceService->processScan(
            $schoolId,
            $request->validated('barcode_value'),
            $request->validated('gate_device_id'),
            $request->user()->id,
        );

        return ApiResponse::success($this->present($outcome));
    }

    /**
     * Read-only school_calendars, reachable by guard (Prompt 25 Part D)
     * without giving guard any access to the rest of Settings (Attendance
     * Rules, School Profile, License) — deliberately its own narrow
     * endpoint under access-gate-scanner, not a shared Settings route.
     */
    public function calendar(Request $request): JsonResponse
    {
        $schoolId = $this->schoolResolver->resolve($request->user());

        $entries = SchoolCalendar::query()
            ->where('school_id', $schoolId)
            ->orderBy('date')
            ->get(['id', 'date', 'day_type', 'label', 'half_day_end_time']);

        return ApiResponse::success($entries);
    }

    /**
     * @return array<string, mixed>
     */
    private function present(ScanOutcome $outcome): array
    {
        $owner = $outcome->owner;
        $ownerType = $outcome->event->resolved_owner_type;
        $record = $outcome->record;

        return [
            'result' => $outcome->event->result->value,
            'needs_review' => $outcome->event->needs_review,
            'sms_sent' => $outcome->smsSent,
            'scanned_at' => $outcome->event->scanned_at->toIso8601String(),
            'owner_type' => $ownerType,
            'student' => $ownerType === 'student' && $owner ? [
                'id' => $owner->id,
                'first_name' => $owner->first_name,
                'last_name' => $owner->last_name,
                'school_class' => $owner->schoolClass ? [
                    'id' => $owner->schoolClass->id,
                    'name' => $owner->schoolClass->name,
                    'section' => $owner->schoolClass->section,
                ] : null,
            ] : null,
            'staff' => $ownerType === 'staff' && $owner ? [
                'id' => $owner->id,
                'name' => $owner->user->name,
                'designation' => $owner->designation,
            ] : null,
            'record' => $record ? [
                'in_time' => $record->in_time,
                'out_time' => $record->out_time,
                'status' => $record->status->value,
                'late' => $record->late,
                'early_departure' => $record->early_departure,
            ] : null,
        ];
    }
}
