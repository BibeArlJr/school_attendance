<?php

namespace App\Modules\Attendance\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Attendance\Http\Requests\ScanRequest;
use App\Modules\Attendance\Services\AttendanceService;
use App\Modules\Attendance\Services\ScanOutcome;
use App\Support\Responses\ApiResponse;
use App\Support\Services\CurrentSchoolResolver;
use Illuminate\Http\JsonResponse;

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
     * @return array<string, mixed>
     */
    private function present(ScanOutcome $outcome): array
    {
        $student = $outcome->student;
        $record = $outcome->record;

        return [
            'result' => $outcome->event->result->value,
            'needs_review' => $outcome->event->needs_review,
            'sms_sent' => $outcome->smsSent,
            'scanned_at' => $outcome->event->scanned_at->toIso8601String(),
            'student' => $student ? [
                'id' => $student->id,
                'first_name' => $student->first_name,
                'last_name' => $student->last_name,
                'admission_no' => $student->admission_no,
                'school_class' => $student->schoolClass ? [
                    'id' => $student->schoolClass->id,
                    'name' => $student->schoolClass->name,
                    'section' => $student->schoolClass->section,
                ] : null,
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
