<?php

namespace App\Support\Enums;

enum SmsTemplateType: string
{
    case AttendanceIn = 'attendance_in';
    case AttendanceOut = 'attendance_out';
    // Staff-facing equivalents (Part F of the rebuild-staff prompt) —
    // sent to the school's chairman_phone, not a guardian. Distinct
    // types (not a reused AttendanceIn/Out) so a school can word staff
    // notifications differently from student ones without one template
    // having to serve both audiences.
    case StaffAttendanceIn = 'staff_attendance_in';
    case StaffAttendanceOut = 'staff_attendance_out';
}
