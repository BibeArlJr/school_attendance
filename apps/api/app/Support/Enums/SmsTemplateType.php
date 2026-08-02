<?php

namespace App\Support\Enums;

enum SmsTemplateType: string
{
    case AttendanceIn = 'attendance_in';
    case AttendanceOut = 'attendance_out';
}
