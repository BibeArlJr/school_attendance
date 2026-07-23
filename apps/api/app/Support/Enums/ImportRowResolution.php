<?php

namespace App\Support\Enums;

enum ImportRowResolution: string
{
    case Pending = 'pending';
    case Accept = 'accept';
    case Skip = 'skip';
}
