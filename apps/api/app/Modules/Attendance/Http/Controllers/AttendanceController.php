<?php

namespace App\Modules\Attendance\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Resources\AttendanceEventResource;
use App\Http\Resources\AttendanceRecordResource;
use App\Modules\Attendance\Http\Requests\ReviewAttendanceEventRequest;
use App\Modules\Attendance\Http\Requests\UpdateAttendanceRecordRequest;
use App\Modules\Attendance\Models\AttendanceEvent;
use App\Modules\Attendance\Models\AttendanceRecord;
use App\Modules\Student\Models\Student;
use App\Support\Enums\AttendanceEventResult;
use App\Support\Responses\ApiResponse;
use App\Support\Services\CurrentSchoolResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    public function __construct(private readonly CurrentSchoolResolver $schoolResolver)
    {
    }

    /**
     * Today's (or a specified date's) attendance_records — a student who
     * never scanned has no row at all and simply won't appear here (see
     * the seed data's genuinely-absent students); this endpoint reflects
     * that literally rather than synthesizing an "absent" row.
     */
    public function index(Request $request): JsonResponse
    {
        $schoolId = $this->schoolResolver->resolve($request->user());
        $date = $request->query('date', now()->toDateString());

        $query = AttendanceRecord::query()
            ->where('school_id', $schoolId)
            ->where('owner_type', 'student')
            ->where('date', $date)
            ->with('owner.schoolClass');

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($classId = $request->query('class_id')) {
            $query->whereHasMorph('owner', [Student::class], function ($inner) use ($classId) {
                $inner->where('class_id', $classId);
            });
        }

        if ($search = trim((string) $request->query('search', ''))) {
            $query->whereHasMorph('owner', [Student::class], function ($inner) use ($search) {
                $inner->where('first_name', 'ilike', "%{$search}%")
                    ->orWhere('last_name', 'ilike', "%{$search}%")
                    ->orWhere('admission_no', 'ilike', "%{$search}%");
            });
        }

        $records = $query
            ->orderBy('id')
            ->paginate((int) $request->query('per_page', 15))
            ->withQueryString();

        return ApiResponse::success(
            $records->setCollection(
                $records->getCollection()->map(fn (AttendanceRecord $record) => new AttendanceRecordResource($record)),
            ),
        );
    }

    public function anomalies(Request $request): JsonResponse
    {
        $schoolId = $this->schoolResolver->resolve($request->user());

        $events = AttendanceEvent::query()
            ->where('school_id', $schoolId)
            ->where('needs_review', true)
            ->with(['resolvedOwner.schoolClass', 'gateDevice', 'guardUser'])
            ->orderByDesc('scanned_at')
            ->paginate((int) $request->query('per_page', 15))
            ->withQueryString();

        return ApiResponse::success(
            $events->setCollection(
                $events->getCollection()->map(fn (AttendanceEvent $event) => new AttendanceEventResource($event)),
            ),
        );
    }

    public function reviewEvent(ReviewAttendanceEventRequest $request, AttendanceEvent $attendanceEvent): JsonResponse
    {
        // Clears needs_review — that's what actually removes it from the
        // anomaly queue; reviewed_by/at/note remain as the audit trail of
        // who reviewed it and why.
        $attendanceEvent->update([
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'review_note' => $request->validated('review_note'),
            'needs_review' => false,
        ]);

        return ApiResponse::success(new AttendanceEventResource($attendanceEvent), 'Event marked reviewed.');
    }

    public function updateRecord(UpdateAttendanceRecordRequest $request, AttendanceRecord $attendanceRecord): JsonResponse
    {
        $attendanceRecord->update([
            ...$request->safe()->only(['in_time', 'out_time', 'status', 'late', 'early_departure']),
            'source' => 'manual',
            'modified_by' => $request->user()->id,
            'override_reason' => $request->validated('override_reason'),
        ]);

        return ApiResponse::success(new AttendanceRecordResource($attendanceRecord), 'Attendance record updated.');
    }

    /**
     * Last ~20 matched scans, most recent first — backs the dashboard's
     * RealGateFeedService (polling, not push).
     */
    public function recentEvents(Request $request): JsonResponse
    {
        $schoolId = $this->schoolResolver->resolve($request->user());

        $events = AttendanceEvent::query()
            ->where('school_id', $schoolId)
            ->whereIn('result', [AttendanceEventResult::MatchedIn, AttendanceEventResult::MatchedOut])
            ->with('resolvedOwner.schoolClass')
            ->orderByDesc('scanned_at')
            ->limit(20)
            ->get();

        return ApiResponse::success($events->map(function (AttendanceEvent $event) {
            $student = $event->resolvedOwner;

            return [
                'id' => (string) $event->id,
                'type' => $event->result === AttendanceEventResult::MatchedIn ? 'entry' : 'exit',
                'studentName' => $student ? "{$student->first_name} {$student->last_name}" : 'Unknown',
                'className' => $student?->schoolClass
                    ? $student->schoolClass->name . ($student->schoolClass->section ? " - {$student->schoolClass->section}" : '')
                    : '—',
                'timestamp' => $event->scanned_at->toIso8601String(),
                'smsStatus' => $this->smsStatusFor($student),
            ];
        })->values());
    }

    private function smsStatusFor(?Student $student): string
    {
        if (! $student) {
            return 'failed';
        }

        $hasPrimaryContact = $student->parentLinks()->where('is_primary_contact', true)->exists();

        return $hasPrimaryContact ? 'sent' : 'failed';
    }
}
