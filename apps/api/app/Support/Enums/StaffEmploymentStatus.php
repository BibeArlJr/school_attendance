<?php

namespace App\Support\Enums;

enum StaffEmploymentStatus: string
{
    case Active = 'active';
    case OnLeave = 'on_leave';
    case Resigned = 'resigned';
}
