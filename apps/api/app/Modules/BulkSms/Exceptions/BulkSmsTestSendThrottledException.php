<?php

namespace App\Modules\BulkSms\Exceptions;

use RuntimeException;

/**
 * Thrown when a second test-send request for the same normalized
 * number arrives within the 5-second double-click window (see
 * BulkSmsTestSendService). Not a validation error — the request shape
 * is fine, it's just too soon.
 */
class BulkSmsTestSendThrottledException extends RuntimeException
{
}
