<?php

namespace App\Support\Exceptions;

use RuntimeException;

/**
 * Thrown by EnsureSchoolActive for any request from an already-authenticated
 * user whose school has been deactivated (Prompt 46 — closes a gap found
 * while writing the license/deactivation test suite: AuthService already
 * blocked *new* logins for a suspended school, but a token issued before
 * deactivation kept working against every route indefinitely until it
 * expired — reads included, unlike license expiry which only ever blocked
 * writes). Caught globally in bootstrap/app.php, same pattern as
 * LicenseExpiredException/NoActiveSchoolSelectedException.
 */
class SchoolSuspendedException extends RuntimeException
{
}
