<?php

namespace App\Support\Enums;

enum AttendanceSource: string
{
    case Scan = 'scan';
    case Manual = 'manual';
}
