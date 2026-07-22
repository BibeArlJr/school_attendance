<?php

namespace App\Modules\Attendance\Services;

use App\Modules\Attendance\Models\AttendanceEvent;
use App\Modules\Attendance\Models\AttendanceRecord;
use App\Modules\Student\Models\Student;

/**
 * Everything the frontend needs to render one scan's outcome in a single
 * response — no follow-up fetch required (Prompt 7's endpoint spec).
 */
readonly class ScanOutcome
{
    public function __construct(
        public AttendanceEvent $event,
        public ?Student $student = null,
        public ?AttendanceRecord $record = null,
        public bool $smsSent = false,
    ) {
    }
}
