<?php

namespace App\Support\Enums;

enum SmsLogStatus: string
{
    case Sent = 'sent';
    case Failed = 'failed';
}
