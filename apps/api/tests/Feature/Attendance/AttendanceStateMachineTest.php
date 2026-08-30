<?php

namespace Tests\Feature\Attendance;

use App\Modules\Attendance\Models\AttendanceEvent;
use App\Modules\Attendance\Models\AttendanceRecord;
use App\Modules\Attendance\Services\AttendanceAnalyticsService;
use App\Modules\Attendance\Services\AttendanceService;
use App\Modules\School\Models\School;
use App\Modules\Student\Models\Student;
use App\Support\Contracts\SmsServiceInterface;
use App\Support\Enums\AttendanceEventResult;
use App\Support\Enums\AttendanceRecordStatus;
use App\Support\Enums\CalendarDayType;
use App\Support\Enums\IdCardStatus;
use App\Support\Enums\RecordDayType;
use App\Support\Enums\StudentStatus;
use Carbon\Carbon;
use Tests\Support\CreatesTestData;
use Tests\TestCase;

/**
 * Prompt 46 Suite A — every scenario the scan-processing state machine
 * (AttendanceService::processScan) is documented to handle, including the
 * two fixes (Prompt 34's staff-barcode removal, Prompt 39's timezone bug)
 * that must never silently regress. All times are set via
 * Carbon::setTestNow() with an explicit UTC instant — never the process's
 * real "now" — so every scenario is reproducible regardless of when the
 * suite actually runs.
 *
 * Nepal is UTC+05:45. 2026-08-10 is a Monday (a working day per
 * working_days=[0..5], Sun-Fri); school hours are 08:00-15:30,
 * late_threshold_minutes=15, early_departure_threshold_minutes=30,
 * duplicate_scan_window_seconds=30 (see CreatesTestData::makeSchoolConfig).
 */
class AttendanceStateMachineTest extends TestCase
{
    use CreatesTestData;

    private School $school;

    private Student $student;

    private string $barcode = 'BC-STUDENT-001';

    protected function setUp(): void
    {
        parent::setUp();

        $this->school = $this->makeSchool();
        $this->makeSchoolConfig($this->school);
        $this->student = $this->makeStudent($this->school);
        $this->makeIdCard($this->school, $this->student, 'student', $this->barcode);
    }

    private function scanAt(string $nepalDateTime, ?string $barcode = null): \App\Modules\Attendance\Services\ScanOutcome
    {
        $utc = Carbon::parse($nepalDateTime, 'Asia/Kathmandu')->setTimezone('UTC');
        Carbon::setTestNow($utc);

        $outcome = app(AttendanceService::class)->processScan(
            $this->school->id,
            $barcode ?? $this->barcode,
            null,
            null,
        );

        // Refresh so boolean/default columns (e.g. `late`, never explicitly
        // set to false anywhere) reflect what Postgres actually persisted,
        // not an in-memory attribute that was simply never assigned.
        $outcome->record?->refresh();

        return $outcome;
    }

    public function test_fresh_scan_matches_in_and_creates_correct_record(): void
    {
        $outcome = $this->scanAt('2026-08-10 08:05:00');

        $this->assertSame(AttendanceEventResult::MatchedIn, $outcome->event->result);
        $this->assertNotNull($outcome->record);
        $this->assertSame('08:05:00', $outcome->record->in_time);
        $this->assertNull($outcome->record->out_time);
        $this->assertFalse($outcome->record->late);
        $this->assertSame(AttendanceRecordStatus::Present, $outcome->record->status);
        $this->assertSame('2026-08-10', $outcome->record->date->toDateString());
        $this->assertSame(1, AttendanceRecord::query()->count());
    }

    public function test_duplicate_scan_within_window_is_ignored_with_zero_record_change(): void
    {
        $this->scanAt('2026-08-10 08:05:00');
        $recordAfterFirst = AttendanceRecord::query()->sole();

        $outcome = $this->scanAt('2026-08-10 08:05:20'); // 20s later, within the 30s window

        $this->assertSame(AttendanceEventResult::DuplicateIgnored, $outcome->event->result);
        $this->assertSame(1, AttendanceRecord::query()->count());
        $recordAfter = AttendanceRecord::query()->sole();
        $this->assertSame($recordAfterFirst->in_time, $recordAfter->in_time);
        $this->assertSame($recordAfterFirst->out_time, $recordAfter->out_time);
        $this->assertSame($recordAfterFirst->updated_at->toIso8601String(), $recordAfter->updated_at->toIso8601String());
    }

    public function test_second_scan_after_in_matches_out_with_correct_time(): void
    {
        $this->scanAt('2026-08-10 08:05:00');

        $outcome = $this->scanAt('2026-08-10 15:35:00'); // >30s after the first scan

        $this->assertSame(AttendanceEventResult::MatchedOut, $outcome->event->result);
        $this->assertSame('08:05:00', $outcome->record->in_time);
        $this->assertSame('15:35:00', $outcome->record->out_time);
        $this->assertSame(1, AttendanceRecord::query()->count());
    }

    public function test_third_scan_reentry_updates_out_time_again_with_full_event_history_preserved(): void
    {
        $this->scanAt('2026-08-10 08:05:00'); // IN
        $this->scanAt('2026-08-10 15:35:00'); // OUT

        $outcome = $this->scanAt('2026-08-10 16:00:00'); // re-entry: updates out_time again

        $this->assertSame(AttendanceEventResult::MatchedOut, $outcome->event->result);
        $this->assertSame('08:05:00', $outcome->record->in_time);
        $this->assertSame('16:00:00', $outcome->record->out_time);
        $this->assertSame(1, AttendanceRecord::query()->count(), 'still only one record per owner/day');
        $this->assertSame(3, AttendanceEvent::query()->count(), 'full scan history preserved in attendance_events');
    }

    public function test_late_arrival_past_threshold_is_flagged_late(): void
    {
        $outcome = $this->scanAt('2026-08-10 08:20:00'); // start_time 08:00 + late_threshold 15min = 08:15 cutoff

        $this->assertTrue($outcome->record->late);
        $this->assertSame(AttendanceRecordStatus::Late, $outcome->record->status);
    }

    public function test_on_time_arrival_is_not_flagged_late(): void
    {
        $outcome = $this->scanAt('2026-08-10 08:10:00'); // before the 08:15 cutoff

        $this->assertFalse($outcome->record->late);
    }

    public function test_early_departure_before_threshold_is_flagged(): void
    {
        $this->scanAt('2026-08-10 08:05:00'); // IN

        // end_time 15:30 - early_departure_threshold 30min = 15:00 cutoff
        $outcome = $this->scanAt('2026-08-10 14:30:00');

        $this->assertTrue($outcome->record->early_departure);
    }

    public function test_normal_departure_after_threshold_is_not_flagged_early(): void
    {
        $this->scanAt('2026-08-10 08:05:00'); // IN

        $outcome = $this->scanAt('2026-08-10 15:35:00');

        $this->assertFalse($outcome->record->early_departure);
    }

    public function test_unknown_barcode_is_rejected_with_no_record_created(): void
    {
        $outcome = $this->scanAt('2026-08-10 08:05:00', 'BARCODE-DOES-NOT-EXIST');

        $this->assertSame(AttendanceEventResult::UnknownBarcode, $outcome->event->result);
        $this->assertTrue($outcome->event->needs_review);
        $this->assertNull($outcome->record);
        $this->assertSame(0, AttendanceRecord::query()->count());
    }

    public function test_inactive_card_is_rejected(): void
    {
        $card = $this->makeIdCard($this->school, $this->student, 'student', 'BC-INACTIVE-CARD', IdCardStatus::Deactivated);

        $outcome = $this->scanAt('2026-08-10 08:05:00', $card->barcode_value);

        $this->assertSame(AttendanceEventResult::CardInactive, $outcome->event->result);
        $this->assertTrue($outcome->event->needs_review);
        $this->assertNull($outcome->record);
        $this->assertSame(0, AttendanceRecord::query()->count());
    }

    public function test_inactive_student_is_rejected(): void
    {
        $inactiveStudent = $this->makeStudent($this->school, null, ['status' => StudentStatus::Inactive]);
        $card = $this->makeIdCard($this->school, $inactiveStudent, 'student', 'BC-INACTIVE-STUDENT');

        $outcome = $this->scanAt('2026-08-10 08:05:00', $card->barcode_value);

        $this->assertSame(AttendanceEventResult::OwnerInactive, $outcome->event->result);
        $this->assertTrue($outcome->event->needs_review);
        $this->assertNull($outcome->record);
        $this->assertSame(0, AttendanceRecord::query()->count());
    }

    /**
     * Staff attendance was reintroduced (rebuild-staff prompt) — a staff
     * barcode now runs through the exact same state machine a student's
     * does: identity resolves to a real owner, a record is created, and
     * it's genuinely tracked, not treated as an unknown barcode.
     */
    public function test_staff_scan_matches_in_and_creates_correct_record(): void
    {
        $staff = $this->makeStaffMember($this->school);
        $staffCard = $this->makeIdCard($this->school, $staff, 'staff', 'BC-STAFF-001');

        $outcome = $this->scanAt('2026-08-10 08:05:00', $staffCard->barcode_value);

        $this->assertSame(AttendanceEventResult::MatchedIn, $outcome->event->result);
        $this->assertNotNull($outcome->record);
        $this->assertSame('staff', $outcome->record->owner_type);
        $this->assertSame($staff->id, $outcome->record->owner_id);
        $this->assertSame('08:05:00', $outcome->record->in_time);
        $this->assertNull($outcome->record->out_time);
        $this->assertFalse($outcome->record->late);
        $this->assertSame(AttendanceRecordStatus::Present, $outcome->record->status);
    }

    /**
     * A resigned staff member's card is rejected via OwnerInactive — same
     * "owner exists but isn't active" branch a deactivated student
     * already hits, not the unknown-barcode path.
     */
    public function test_resigned_staff_scan_is_rejected_as_owner_inactive(): void
    {
        $staff = $this->makeStaffMember($this->school, ['employment_status' => \App\Support\Enums\StaffEmploymentStatus::Resigned]);
        $staffCard = $this->makeIdCard($this->school, $staff, 'staff', 'BC-STAFF-RESIGNED');

        $outcome = $this->scanAt('2026-08-10 08:05:00', $staffCard->barcode_value);

        $this->assertSame(\App\Support\Enums\AttendanceEventResult::OwnerInactive, $outcome->event->result);
        $this->assertNull($outcome->record);
    }

    /**
     * Staff has no guardian — the notification goes to the school's
     * chairman_phone (school_configs) instead. No chairman_phone
     * configured must skip silently (never block the scan itself), same
     * "notification is a side effect" contract the student path has.
     */
    public function test_staff_notification_goes_to_chairman_phone_not_a_guardian(): void
    {
        $staff = $this->makeStaffMember($this->school);
        $staffCard = $this->makeIdCard($this->school, $staff, 'staff', 'BC-STAFF-CHAIRMAN');

        // No chairman_phone configured yet (makeSchoolConfig's default) —
        // the scan must still succeed, just with no notification sent.
        $noPhoneOutcome = $this->scanAt('2026-08-10 08:05:00', $staffCard->barcode_value);
        $this->assertNotNull($noPhoneOutcome->record);
        $this->assertFalse($noPhoneOutcome->smsSent);

        \App\Modules\Attendance\Models\SchoolConfig::query()->find($this->school->id)->update(['chairman_phone' => '9800000099']);

        $mock = $this->mock(SmsServiceInterface::class);
        $mock->shouldReceive('send')
            ->once()
            ->with('9800000099', \Mockery::type('string'), $this->school->id, \Mockery::type('int'));

        $outOutcome = $this->scanAt('2026-08-10 15:35:00', $staffCard->barcode_value);
        $this->assertTrue($outOutcome->smsSent);
    }

    public function test_scan_outside_scheduled_hours_still_creates_record_but_flags_needs_review(): void
    {
        // end_time 15:30 + 60min buffer = 16:30 window edge; 18:00 is well outside it.
        $outcome = $this->scanAt('2026-08-10 18:00:00');

        $this->assertSame(AttendanceEventResult::MatchedIn, $outcome->event->result);
        $this->assertNotNull($outcome->record);
        $this->assertTrue($outcome->event->needs_review);
    }

    public function test_holiday_is_flagged_non_school_day_and_excluded_from_absence_calculations(): void
    {
        // 2026-08-17 is a Monday (otherwise a working day) marked as a holiday.
        $this->makeSchoolCalendar($this->school, '2026-08-17', CalendarDayType::Holiday);

        $outcome = $this->scanAt('2026-08-17 08:05:00');

        $this->assertSame(RecordDayType::NonSchoolDay, $outcome->record->day_type);

        $analytics = app(AttendanceAnalyticsService::class);
        $this->assertFalse($analytics->isWorkingDay($this->school->id, Carbon::parse('2026-08-17')));
        // A second, unscanned active student must not show up as "absent"
        // on a day nobody was expected to attend.
        $this->makeStudent($this->school);
        $this->assertCount(0, $analytics->absentOwnerIds($this->school->id, Carbon::parse('2026-08-17')));
    }

    public function test_notification_service_called_on_matched_in_and_out_but_not_on_duplicate_or_rejection(): void
    {
        $parent = $this->makeParentGuardian($this->school, ['phone' => '9811111111']);
        $this->linkParent($this->student, $parent, true);

        $mock = $this->mock(SmsServiceInterface::class);
        $mock->shouldReceive('send')->twice(); // once for the IN, once for the OUT — never for the duplicate or the rejection below

        $this->scanAt('2026-08-10 08:05:00'); // IN -> notify
        $this->scanAt('2026-08-10 08:05:15'); // duplicate -> no notify
        $this->scanAt('2026-08-10 08:05:00', 'BARCODE-DOES-NOT-EXIST'); // rejection -> no notify
        $this->scanAt('2026-08-10 15:35:00'); // OUT -> notify
    }

    /**
     * The timezone regression test (Prompt 39). A UTC instant of
     * 2026-08-10 18:45:00 is 2026-08-11 00:30:00 in Nepal (UTC+05:45) —
     * both the CALENDAR DATE and the CLOCK TIME differ from the naive UTC
     * reading. Before Prompt 39's fix, a wall-clock read straight off the
     * UTC instant would have silently recorded the wrong date (one day
     * behind) and the wrong time — exactly the kind of bug that stays
     * invisible until someone checks a scan from Nepal's small hours.
     */
    public function test_scan_in_nepal_early_morning_window_is_correctly_npt_converted_not_utc(): void
    {
        Carbon::setTestNow(Carbon::create(2026, 8, 10, 18, 45, 0, 'UTC'));

        $outcome = app(AttendanceService::class)->processScan($this->school->id, $this->barcode, null, null);

        $this->assertSame('2026-08-11', $outcome->record->date->toDateString(), 'must be the Nepal calendar date, not the UTC one');
        $this->assertSame('00:30:00', $outcome->record->in_time, 'must be the Nepal wall-clock time, not the UTC one');
    }

    /**
     * Case-insensitivity regression test (Prompt 51) — barcode scanners
     * commonly desync their internal Caps Lock/Shift state and emit the
     * wrong case for a typed-out barcode value. id_cards.barcode_value
     * stays stored exactly as generated (uppercase); this only covers how
     * an incoming scanned value gets compared against it.
     */
    public function test_scan_with_lowercase_barcode_resolves_to_the_same_card(): void
    {
        $outcome = $this->scanAt('2026-08-10 08:05:00', strtolower($this->barcode));

        $this->assertSame(AttendanceEventResult::MatchedIn, $outcome->event->result);
        $this->assertNotNull($outcome->record, 'a lowercase scan of a real barcode must still match its card');
    }

    public function test_scan_with_mixed_case_barcode_resolves_to_the_same_card(): void
    {
        // Alternating upper/lower per character — derived from the real
        // stored value rather than a hand-typed literal, so this stays
        // correct if $barcode is ever changed.
        $mixedCase = implode('', array_map(
            fn (string $char, int $i) => $i % 2 === 0 ? strtolower($char) : $char,
            str_split($this->barcode),
            array_keys(str_split($this->barcode)),
        ));
        $this->assertNotSame($this->barcode, $mixedCase, 'sanity check: this really is a different string than the stored value');

        $outcome = $this->scanAt('2026-08-10 08:05:00', $mixedCase);

        $this->assertSame(AttendanceEventResult::MatchedIn, $outcome->event->result);
        $this->assertNotNull($outcome->record);
    }
}
