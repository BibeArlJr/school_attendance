<?php

namespace App\Support\Enums;

enum LicenseStatus: string
{
    case Active = 'active';
    case Grace = 'grace';
    case Expired = 'expired';
}
