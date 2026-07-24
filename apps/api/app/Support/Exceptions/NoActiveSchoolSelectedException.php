<?php

namespace App\Support\Exceptions;

use RuntimeException;

/**
 * Thrown by CurrentSchoolResolver for a super_admin who hasn't selected a
 * school yet (Prompt 24) — deliberately never silently defaults to "the
 * only school" the way the pre-Prompt-24 fallback did. Caught globally in
 * bootstrap/app.php (not per-controller — CurrentSchoolResolver is called
 * from dozens of controllers, and a global handler is the only way to
 * cover all of them without touching every call site) and converted to a
 * distinguishable 409 the frontend uses to show the "select a school"
 * prompt instead of a generic error.
 */
class NoActiveSchoolSelectedException extends RuntimeException
{
}
