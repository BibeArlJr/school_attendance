<?php

namespace App\Modules\Attendance\Services;

use App\Modules\Attendance\Models\AttendanceEvent;
use App\Modules\Attendance\Models\AttendanceRecord;
use App\Modules\Attendance\Models\GateDevice;
use App\Modules\Attendance\Models\SchoolCalendar;
use App\Modules\Attendance\Models\SchoolConfig;
use App\Modules\IdCard\Models\IdCard;
use App\Modules\Student\Models\Student;
use App\Support\Contracts\SmsServiceInterface;
use App\Support\Enums\AttendanceEventResult;
use App\Support\Enums\AttendanceRecordStatus;
use App\Support\Enums\AttendanceSource;
use App\Support\Enums\CalendarDayType;
use App\Support\Enums\IdCardStatus;
use App\Support\Enums\RecordDayType;
use App\Support\Enums\StudentStatus;
use App\Support\Services\NepalTime;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * The scan-processing state machine. All business logic for a barcode
 * scan lives here, not in the controller — see Prompt 7's architecture
 * constraint. Prompt 8 generalized identity resolution and the
 * notification step to also handle owner_type = 'staff'; Prompt 34
 * reverses that — a scanned barcode only ever resolves against student
 * id_cards now (any lingering staff id_cards row is historical data,
 * treated exactly like an unrecognized barcode below). The IN/OUT/
 * duplicate/late/anomaly logic itself was never forked on owner type and
 * needed no further changes.
 *
 * "Outside the scheduled window" (step 3's needs_review flag on an
 * otherwise-valid IN) isn't given an exact number in the spec, so this
 * uses a 1-hour buffer before start_time / after end_time — a scan
 * further outside that than the late/early thresholds already cover is
 * unusual enough to flag for admin visibility without being a rejection.
 */
class AttendanceService
{
    private const OUT_OF_WINDOW_BUFFER_MINUTES = 60;

    public function __construct(private readonly SmsServiceInterface $smsService)
    {
    }

    public function processScan(
        int $schoolId,
        string $barcodeValue,
        ?int $gateDeviceId,
        ?int $guardUserId,
    ): ScanOutcome {
        // $now is the true UTC instant — used only for scanned_at (the
        // honest record of when this happened) and for diffing against
        // other scanned_at instants. Every NPT-semantic wall-clock field
        // (attendance_records.date/in_time/out_time, day-of-week/calendar
        // lookups, late/early/window comparisons, the SMS text's time)
        // must instead derive from $nepalNow (Prompt 39) — Nepal's local
        // wall clock, not UTC's.
        $now = Carbon::now();
        $nepalNow = NepalTime::now();
        $gateDeviceId ??= GateDevice::query()->where('school_id', $schoolId)->value('id');

        // --- Step 1: identity resolution ---
        $idCard = IdCard::query()->where('school_id', $schoolId)->where('barcode_value', $barcodeValue)->first();

        if (! $idCard) {
            $event = $this->logEvent($schoolId, $barcodeValue, null, null, $gateDeviceId, $guardUserId, $now, AttendanceEventResult::UnknownBarcode, true);

            return new ScanOutcome($event);
        }

        // Staff attendance tracking was removed (Prompt 34 Part B) — any
        // lingering staff id_cards row (historical data, never deleted)
        // is treated exactly like an unrecognized barcode, not processed
        // as a staff scan and not surfaced to the guard as a known owner.
        if ($idCard->owner_type === 'staff') {
            $event = $this->logEvent($schoolId, $barcodeValue, null, null, $gateDeviceId, $guardUserId, $now, AttendanceEventResult::UnknownBarcode, true);

            return new ScanOutcome($event);
        }

        if ($idCard->status !== IdCardStatus::Active) {
            $event = $this->logEvent($schoolId, $barcodeValue, $idCard->owner_type, $idCard->owner_id, $gateDeviceId, $guardUserId, $now, AttendanceEventResult::CardInactive, true);

            return new ScanOutcome($event, $idCard->owner);
        }

        $ownerType = $idCard->owner_type;
        $owner = $idCard->owner;

        if (! $this->isOwnerActive($owner)) {
            $event = $this->logEvent($schoolId, $barcodeValue, $ownerType, $idCard->owner_id, $gateDeviceId, $guardUserId, $now, AttendanceEventResult::OwnerInactive, true);

            return new ScanOutcome($event, $owner);
        }

        // --- Step 2: duplicate check ---
        $config = SchoolConfig::query()->findOrFail($schoolId);

        $lastEvent = AttendanceEvent::query()
            ->where('school_id', $schoolId)
            ->where('barcode_value', $barcodeValue)
            ->whereDate('scanned_at', $now->toDateString())
            ->orderByDesc('scanned_at')
            ->first();

        if ($lastEvent && $lastEvent->scanned_at->diffInSeconds($now) < $config->duplicate_scan_window_seconds) {
            $event = $this->logEvent($schoolId, $barcodeValue, $ownerType, $owner->id, $gateDeviceId, $guardUserId, $now, AttendanceEventResult::DuplicateIgnored, false);

            $existingRecord = AttendanceRecord::query()
                ->where('school_id', $schoolId)
                ->where('owner_type', $ownerType)
                ->where('owner_id', $owner->id)
                ->where('date', $nepalNow->toDateString())
                ->first();

            return new ScanOutcome($event, $owner, $existingRecord);
        }

        return DB::transaction(function () use ($schoolId, $barcodeValue, $gateDeviceId, $guardUserId, $now, $nepalNow, $owner, $ownerType, $config) {
            // --- Step 4: day_type resolution ---
            [$calendarDayType, $recordDayType] = $this->resolveDayType($schoolId, $nepalNow, $config);

            $record = AttendanceRecord::query()->firstOrNew([
                'school_id' => $schoolId,
                'owner_type' => $ownerType,
                'owner_id' => $owner->id,
                'date' => $nepalNow->toDateString(),
            ]);

            if (! $record->exists) {
                $record->day_type = $recordDayType;
                $record->source = AttendanceSource::Scan;
            }

            $eventNeedsReview = false;

            // --- Step 3 (+ step 5's defensive 4th case) ---
            if ($record->in_time === null && $record->out_time === null) {
                // No scan yet today: IN.
                $record->in_time = $nepalNow->format('H:i:s');
                $result = AttendanceEventResult::MatchedIn;

                $lateBy = Carbon::parse($config->start_time)->addMinutes($config->late_threshold_minutes);
                if ($nepalNow->format('H:i:s') > $lateBy->format('H:i:s')) {
                    $record->late = true;
                }

                if ($this->isOutsideScheduledWindow($nepalNow, $config)) {
                    $eventNeedsReview = true;
                }
            } elseif ($record->in_time !== null && $record->out_time === null) {
                // Already checked in today, no out yet: OUT.
                $record->out_time = $nepalNow->format('H:i:s');
                $result = AttendanceEventResult::MatchedOut;

                $earlyBy = $this->earlyDepartureThreshold($calendarDayType, $config, $nepalNow);
                if ($nepalNow->format('H:i:s') < $earlyBy->format('H:i:s')) {
                    $record->early_departure = true;
                }
            } elseif ($record->in_time !== null && $record->out_time !== null) {
                // Re-entry/re-exit: only first-in/last-out per day is tracked
                // here — full history stays in attendance_events regardless.
                $record->out_time = $nepalNow->format('H:i:s');
                $result = AttendanceEventResult::MatchedOut;
            } else {
                // Defensive: out_time set with no in_time (e.g. a prior
                // manual correction left the record in this state).
                // Shouldn't happen via the branches above, but if it does,
                // still process it as an out-scan and still notify.
                $record->out_time = $nepalNow->format('H:i:s');
                $record->status = AttendanceRecordStatus::OutWithoutIn;
                $eventNeedsReview = true;
                $result = AttendanceEventResult::MatchedOut;
            }

            if ($record->status !== AttendanceRecordStatus::OutWithoutIn) {
                $record->status = $this->computeStatus($record, $calendarDayType);
            }

            $record->save();

            $event = $this->logEvent($schoolId, $barcodeValue, $ownerType, $owner->id, $gateDeviceId, $guardUserId, $now, $result, $eventNeedsReview);

            // Notification step: $owner is always a Student past the
            // staff-card rejection above (Prompt 34 Part B).
            $smsSent = false;
            if (in_array($result, [AttendanceEventResult::MatchedIn, AttendanceEventResult::MatchedOut], true)) {
                $smsSent = $this->sendParentNotification($owner, $result, $nepalNow, $schoolId, $record->id);
            }

            return new ScanOutcome($event, $owner, $record, $smsSent);
        });
    }

    private function isOwnerActive(Student $owner): bool
    {
        return $owner->status === StudentStatus::Active;
    }

    private function computeStatus(AttendanceRecord $record, CalendarDayType $calendarDayType): AttendanceRecordStatus
    {
        if ($record->late) {
            return AttendanceRecordStatus::Late;
        }

        if ($calendarDayType === CalendarDayType::HalfDay && $record->in_time !== null) {
            return AttendanceRecordStatus::HalfDay;
        }

        return AttendanceRecordStatus::Present;
    }

    /**
     * @return array{0: CalendarDayType, 1: RecordDayType}
     */
    private function resolveDayType(int $schoolId, Carbon $nepalNow, SchoolConfig $config): array
    {
        $calendarEntry = SchoolCalendar::query()
            ->where('school_id', $schoolId)
            ->whereDate('date', $nepalNow->toDateString())
            ->first();

        $calendarDayType = $calendarEntry?->day_type ?? CalendarDayType::Working;

        $isWorkingWeekday = in_array($nepalNow->dayOfWeek, $config->working_days, true);
        $isNonSchoolDay = ! $isWorkingWeekday
            || in_array($calendarDayType, [CalendarDayType::Holiday, CalendarDayType::ExamDay], true);

        return [$calendarDayType, $isNonSchoolDay ? RecordDayType::NonSchoolDay : RecordDayType::Working];
    }

    private function isOutsideScheduledWindow(Carbon $nepalNow, SchoolConfig $config): bool
    {
        $windowStart = Carbon::parse($config->start_time)->subMinutes(self::OUT_OF_WINDOW_BUFFER_MINUTES);
        $windowEnd = Carbon::parse($config->end_time)->addMinutes(self::OUT_OF_WINDOW_BUFFER_MINUTES);

        return $nepalNow->format('H:i:s') < $windowStart->format('H:i:s')
            || $nepalNow->format('H:i:s') > $windowEnd->format('H:i:s');
    }

    /**
     * On a half-day, the early-departure threshold applies against
     * half_day_end_time instead of the school's normal end_time —
     * otherwise every ordinary half-day departure would be misflagged as
     * "early." Not explicitly spelled out in the spec, but half_day_end_time
     * exists in school_calendars specifically for this.
     */
    private function earlyDepartureThreshold(CalendarDayType $calendarDayType, SchoolConfig $config, Carbon $nepalNow): Carbon
    {
        if ($calendarDayType === CalendarDayType::HalfDay) {
            $calendarEntry = SchoolCalendar::query()
                ->where('school_id', $config->school_id)
                ->whereDate('date', $nepalNow->toDateString())
                ->first();

            if ($calendarEntry?->half_day_end_time) {
                return Carbon::parse($calendarEntry->half_day_end_time)
                    ->subMinutes($config->early_departure_threshold_minutes);
            }
        }

        return Carbon::parse($config->end_time)->subMinutes($config->early_departure_threshold_minutes);
    }

    private function sendParentNotification(
        Student $student,
        AttendanceEventResult $result,
        Carbon $nepalNow,
        int $schoolId,
        ?int $recordId,
    ): bool {
        $primaryLink = $student->parentLinks()
            ->where('is_primary_contact', true)
            ->with('parentGuardian')
            ->first();

        if (! $primaryLink) {
            // No guardian configured for this student — nothing to notify,
            // not an error condition.
            return false;
        }

        $school = $student->school;
        $action = $result === AttendanceEventResult::MatchedIn ? 'entered' : 'left';
        $time = $nepalNow->format('g:i A');
        $message = "Dear Parent, your child {$student->first_name} {$student->last_name} "
            . "{$action} {$school->name} at {$time}.";

        // Defense in depth: SmsServiceInterface::send() is contractually
        // never supposed to throw (each implementation catches its own
        // delivery failures), but attendance recording must survive even
        // if that contract is ever violated — a scan must never fail to
        // record because a notification attempt blew up.
        try {
            $this->smsService->send($primaryLink->parentGuardian->phone, $message, $schoolId, $recordId);
        } catch (Throwable $e) {
            Log::error('SMS notification threw unexpectedly', [
                'school_id' => $schoolId,
                'attendance_record_id' => $recordId,
                'error' => $e->getMessage(),
            ]);

            return false;
        }

        return true;
    }

    private function logEvent(
        int $schoolId,
        string $barcodeValue,
        ?string $ownerType,
        ?int $ownerId,
        ?int $gateDeviceId,
        ?int $guardUserId,
        Carbon $scannedAt,
        AttendanceEventResult $result,
        bool $needsReview,
    ): AttendanceEvent {
        return AttendanceEvent::create([
            'school_id' => $schoolId,
            'barcode_value' => $barcodeValue,
            'resolved_owner_type' => $ownerType,
            'resolved_owner_id' => $ownerId,
            'gate_device_id' => $gateDeviceId,
            'guard_user_id' => $guardUserId,
            'scanned_at' => $scannedAt,
            'result' => $result,
            'needs_review' => $needsReview,
        ]);
    }
}
