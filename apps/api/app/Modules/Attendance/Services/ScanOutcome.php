<?php

namespace App\Modules\Attendance\Services;

use App\Modules\Attendance\Models\AttendanceEvent;
use App\Modules\Attendance\Models\AttendanceRecord;
use App\Modules\Staff\Models\Staff;
use App\Modules\Student\Models\Student;

/**
 * Everything the frontend needs to render one scan's outcome in a single
 * response — no follow-up fetch required (Prompt 7's endpoint spec).
 * $owner is a Student or a Staff member (Prompt 8 generalizes identity
 * resolution to both) — never both at once.
 */
readonly class ScanOutcome
{
    public function __construct(
        public AttendanceEvent $event,
        public Student|Staff|null $owner = null,
        public ?AttendanceRecord $record = null,
        public bool $smsSent = false,
    ) {
    }
}
