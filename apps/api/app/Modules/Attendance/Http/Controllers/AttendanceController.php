<?php

namespace App\Modules\Attendance\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Resources\AttendanceEventResource;
use App\Http\Resources\AttendanceRecordResource;
use App\Modules\Attendance\Http\Requests\ReviewAttendanceEventRequest;
use App\Modules\Attendance\Http\Requests\UpdateAttendanceRecordRequest;
use App\Modules\Attendance\Models\AttendanceEvent;
use App\Modules\Attendance\Models\AttendanceRecord;
use App\Modules\Attendance\Services\AttendanceAnalyticsService;
use App\Modules\Staff\Models\Staff;
use App\Modules\Student\Models\Student;
use App\Support\Enums\AttendanceEventResult;
use App\Support\Enums\StaffEmploymentStatus;
use App\Support\Enums\StudentStatus;
use App\Support\Responses\ApiResponse;
use App\Support\Services\CurrentSchoolResolver;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class AttendanceController extends Controller
{
    public function __construct(
        private readonly CurrentSchoolResolver $schoolResolver,
        private readonly AttendanceAnalyticsService $analytics,
    ) {
    }

    /**
     * Today's (or a specified date's) attendance_records for either
     * students or staff (owner_type, default student). An owner who never
     * scanned has no row at all — status=absent (below) is the one
     * exception, synthesizing that roster on the fly (Prompt 18) since
     * there's nothing to query for it directly.
     */
    public function index(Request $request): JsonResponse
    {
        $schoolId = $this->schoolResolver->resolve($request->user());
        $date = $request->query('date', now()->toDateString());
        $ownerType = $request->query('owner_type', 'student');

        // "Absent" has no stored row for a no-show (see AttendanceAnalyticsService)
        // — it must be resolved against the owner table (active students/staff
        // minus those with a record), not filtered out of attendance_records.
        if ($request->query('status') === 'absent') {
            return $this->absentIndex($request, $schoolId, $date, $ownerType);
        }

        $query = AttendanceRecord::query()
            ->where('school_id', $schoolId)
            ->where('owner_type', $ownerType)
            ->where('date', $date)
            ->with($ownerType === 'student' ? 'owner.schoolClass' : 'owner.user');

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        // class_id only applies to students — Staff has no class concept.
        if ($ownerType === 'student' && ($classId = $request->query('class_id'))) {
            $query->whereHasMorph('owner', [Student::class], function ($inner) use ($classId) {
                $inner->where('class_id', $classId);
            });
        }

        if ($search = trim((string) $request->query('search', ''))) {
            if ($ownerType === 'student') {
                $query->whereHasMorph('owner', [Student::class], function ($inner) use ($search) {
                    $inner->where('first_name', 'ilike', "%{$search}%")
                        ->orWhere('last_name', 'ilike', "%{$search}%");
                });
            } else {
                $query->whereHasMorph('owner', [Staff::class], function ($inner) use ($search) {
                    $inner->where('designation', 'ilike', "%{$search}%")
                        ->orWhereHas('user', function ($userQuery) use ($search) {
                            $userQuery->where('name', 'ilike', "%{$search}%");
                        });
                });
            }
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

    /**
     * Per-student attendance calendar for an explicit date range — colors
     * each day present/late/absent/holiday/non_school_day/upcoming
     * (Prompt 18 Part B). Takes `from`/`to` (plain Gregorian dates)
     * rather than year/month (Prompt 28 Part B) — the frontend now
     * renders a BS month grid, and a BS month's day range essentially
     * never lines up with an AD calendar month's, so the caller computes
     * the exact AD span a given BS month covers (via the shared toAd/
     * daysInBsMonth utilities) and asks for exactly that. The underlying
     * per-day status logic is untouched either way — it was already a
     * plain date-range scan, never actually Gregorian-month-aware.
     */
    public function studentCalendar(Request $request, Student $student): JsonResponse
    {
        $from = Carbon::parse($request->query('from', now()->startOfMonth()->toDateString()));
        $to = Carbon::parse($request->query('to', now()->endOfMonth()->toDateString()));

        return ApiResponse::success($this->analytics->studentCalendar($student, $from, $to));
    }

    /**
     * Present/absent day totals + attendance percentage for one student,
     * over admission_date-or-academic-year-start through today by default
     * (Prompt 18 Part C) — same shared computation as the dashboard.
     */
    public function studentSummary(Request $request, Student $student): JsonResponse
    {
        $from = $request->query('from') ? Carbon::parse($request->query('from')) : null;
        $to = $request->query('to') ? Carbon::parse($request->query('to')) : null;

        return ApiResponse::success($this->analytics->studentSummary($student, $from, $to));
    }

    /**
     * The synthesized "absent" roster for a date: active owners minus
     * those with an attendance_record, empty on a non-working day. Shaped
     * to match AttendanceRecordResource so the frontend table needs no
     * special-casing, but id is null — there's no real record behind it.
     */
    private function absentIndex(Request $request, int $schoolId, string $date, string $ownerType): JsonResponse
    {
        $perPage = (int) $request->query('per_page', 15);

        if (! $this->analytics->isWorkingDay($schoolId, Carbon::parse($date))) {
            return ApiResponse::success(new LengthAwarePaginator([], 0, $perPage, 1));
        }

        $recordedOwnerIds = AttendanceRecord::query()
            ->where('school_id', $schoolId)
            ->where('owner_type', $ownerType)
            ->where('date', $date)
            ->pluck('owner_id');

        if ($ownerType === 'student') {
            $query = Student::query()
                ->where('school_id', $schoolId)
                ->where('status', StudentStatus::Active)
                ->whereNotIn('id', $recordedOwnerIds)
                ->with('schoolClass');

            if ($classId = $request->query('class_id')) {
                $query->where('class_id', $classId);
            }

            if ($search = trim((string) $request->query('search', ''))) {
                $query->where(function ($inner) use ($search) {
                    $inner->where('first_name', 'ilike', "%{$search}%")
                        ->orWhere('last_name', 'ilike', "%{$search}%");
                });
            }

            $query->orderBy('first_name')->orderBy('last_name');
        } else {
            $query = Staff::query()
                ->where('school_id', $schoolId)
                ->where('employment_status', StaffEmploymentStatus::Active)
                ->whereNotIn('id', $recordedOwnerIds)
                ->with('user');

            if ($search = trim((string) $request->query('search', ''))) {
                $query->where('designation', 'ilike', "%{$search}%")
                    ->orWhereHas('user', function ($userQuery) use ($search) {
                        $userQuery->where('name', 'ilike', "%{$search}%");
                    });
            }

            $query->orderBy('id');
        }

        $owners = $query->paginate($perPage)->withQueryString();

        $data = $owners->getCollection()->map(fn (Student|Staff $owner) => [
            // Negative, never a real attendance_record id — there is no
            // record behind a no-show. source stays null as the real
            // "is this editable" signal for the frontend.
            'id' => -$owner->id,
            'date' => $date,
            'in_time' => null,
            'out_time' => null,
            'status' => 'absent',
            'day_type' => 'working',
            'late' => false,
            'early_departure' => false,
            'source' => null,
            'override_reason' => null,
            'owner_type' => $ownerType,
            'student' => $ownerType === 'student' ? [
                'id' => $owner->id,
                'first_name' => $owner->first_name,
                'last_name' => $owner->last_name,
                'school_class' => $owner->schoolClass ? [
                    'id' => $owner->schoolClass->id,
                    'name' => $owner->schoolClass->name,
                    'section' => $owner->schoolClass->section,
                ] : null,
            ] : null,
            'staff' => $ownerType === 'staff' ? [
                'id' => $owner->id,
                'name' => $owner->user->name,
                'designation' => $owner->designation,
            ] : null,
        ]);

        return ApiResponse::success($owners->setCollection($data));
    }

    public function anomalies(Request $request): JsonResponse
    {
        $schoolId = $this->schoolResolver->resolve($request->user());

        $events = AttendanceEvent::query()
            ->where('school_id', $schoolId)
            ->where('needs_review', true)
            // Anomalies span both owner types, so the morphTo's nested
            // eager load must be per-type (morphWith) — a blanket
            // resolvedOwner.schoolClass would throw calling ::schoolClass()
            // on a Staff instance, which has no such relation.
            ->with([
                'resolvedOwner' => fn ($morphTo) => $morphTo->morphWith([
                    Student::class => ['schoolClass'],
                    Staff::class => ['user'],
                ]),
                'gateDevice',
                'guardUser',
            ])
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
     * RealGateFeedService (polling, not push). Deliberately scoped to
     * students only: GateEvent's studentName/className fields are
     * student-shaped, and mixing staff scans into "Gate Activity" here
     * would misrepresent them under those labels rather than genuinely
     * supporting staff — a Teachers-specific feed is a reasonable future
     * addition, not built in this phase.
     */
    public function recentEvents(Request $request): JsonResponse
    {
        $schoolId = $this->schoolResolver->resolve($request->user());

        $events = AttendanceEvent::query()
            ->where('school_id', $schoolId)
            ->where('resolved_owner_type', 'student')
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
