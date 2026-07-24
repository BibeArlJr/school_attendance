<?php

namespace App\Support\Exceptions;

use RuntimeException;

/**
 * Thrown by EnsureLicenseActive for a write attempt against an expired
 * school (Prompt 25 Part C). Caught globally in bootstrap/app.php (same
 * pattern as NoActiveSchoolSelectedException) and converted to a
 * distinguishable 403 so the frontend can tell this apart from an
 * ordinary permissions failure.
 */
class LicenseExpiredException extends RuntimeException
{
}
