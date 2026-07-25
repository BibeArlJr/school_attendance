<?php

namespace App\Support\Services;

use Carbon\Carbon;

/**
 * The single place "what is Nepal wall-clock time right now" is computed
 * (Prompt 39). `config('app.timezone')` stays UTC — that's correct for
 * storage of true instants (`scanned_at`, `sent_at`). This helper exists
 * for the opposite case: fields that are semantically a local Nepal
 * wall-clock value (`attendance_records.date`/`in_time`/`out_time`, the
 * SMS message's embedded time), which must be derived from Nepal time,
 * not extracted directly off a UTC-zoned instant.
 */
class NepalTime
{
    public const TIMEZONE = 'Asia/Kathmandu';

    public static function now(): Carbon
    {
        return Carbon::now()->setTimezone(self::TIMEZONE);
    }
}
