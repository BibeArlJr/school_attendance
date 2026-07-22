<?php

namespace App\Support\Enums;

enum AttendanceRecordStatus: string
{
    case Present = 'present';
    case Late = 'late';
    case Absent = 'absent';
    case HalfDay = 'half_day';
    case OutWithoutIn = 'out_without_in';
}
