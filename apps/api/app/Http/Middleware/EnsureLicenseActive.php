<?php

namespace App\Http\Middleware;

use App\Support\Enums\LicenseStatus;
use App\Support\Exceptions\LicenseExpiredException;
use Closure;
use Illuminate\Http\Request;

/**
 * Blocks WRITE actions for a school whose subscription has expired
 * (Prompt 25 Part C, extended by Prompt 33 Part C) — attached to every
 * write route the license-strategy spec lists as blocked: student/staff/
 * parent create-edit-delete, imports, attendance corrections, settings
 * changes, and gate-scanner barcode scans (which also gates the SMS sent
 * as part of that scan, since it never reaches the service layer). Never
 * attached to read routes. super_admin is exempt entirely — they're the
 * one role that can still reactivate a school, so they can't be locked
 * out of it.
 *
 * Prompt 25 originally carved out an explicit exception for gate-scanner
 * scans specifically to keep physical hardware working through a billing
 * lapse; Prompt 33 deliberately reverses that so scanning matches the
 * rest of the enforcement list.
 */
class EnsureLicenseActive
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (! $user || $user->role->value === 'super_admin') {
            return $next($request);
        }

        $school = $user->school;

        if ($school && $school->licenseStatus() === LicenseStatus::Expired) {
            throw new LicenseExpiredException();
        }

        return $next($request);
    }
}
