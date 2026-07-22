<?php

namespace App\Support\Enums;

enum EnrollmentStatus: string
{
    case Active = 'active';
    case Repeated = 'repeated';
    case Promoted = 'promoted';
    case TransferredOut = 'transferred_out';
}
