<?php

namespace App\Http\Middleware;

use App\Support\Enums\LicenseStatus;
use App\Support\Exceptions\LicenseExpiredException;
use Closure;
use Illuminate\Http\Request;

/**
 * Blocks WRITE actions for a school whose subscription has expired
 * (Prompt 25 Part C) — graceful degradation, not a lockout: this is only
 * ever attached to specific write routes (creating/editing students,
 * teachers, parents, attendance corrections), never to read routes, and
 * never to the gate-scanner scan endpoint itself (scanning keeps working
 * regardless — locking out the physical gate hardware over a billing
 * lapse would be a far more disruptive outcome than anything asked for
 * here). super_admin is exempt entirely — they're the one role that can
 * still reactivate a school, so they can't be locked out of it.
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
