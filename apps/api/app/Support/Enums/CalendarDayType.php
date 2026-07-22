<?php

namespace App\Support\Enums;

enum CalendarDayType: string
{
    case Working = 'working';
    case Holiday = 'holiday';
    case HalfDay = 'half_day';
    case ExamDay = 'exam_day';
}
