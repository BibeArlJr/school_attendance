<?php

namespace App\Support\Enums;

enum AttendanceEventResult: string
{
    case MatchedIn = 'matched_in';
    case MatchedOut = 'matched_out';
    case DuplicateIgnored = 'duplicate_ignored';
    case UnknownBarcode = 'unknown_barcode';
    case CardInactive = 'card_inactive';
    case OwnerInactive = 'owner_inactive';
}
