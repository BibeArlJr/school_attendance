<?php

namespace App\Support\Enums;

enum IdCardStatus: string
{
    case Active = 'active';
    case Lost = 'lost';
    case Deactivated = 'deactivated';
}
