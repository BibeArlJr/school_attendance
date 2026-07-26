<?php

namespace App\Http\Middleware;

use App\Support\Exceptions\SchoolSuspendedException;
use Closure;
use Illuminate\Http\Request;

/**
 * Blocks EVERY action — reads included, unlike EnsureLicenseActive which
 * only ever gates writes — for a user whose school has been deactivated
 * (is_active = false). Registered on the global 'api' middleware group
 * (see bootstrap/app.php) rather than as a per-route alias, precisely so
 * reads are covered too without having to attach it route-by-route.
 *
 * Prompt 46 — closes a real gap found while writing the license/
 * deactivation test suite: AuthService::login() already refused a fresh
 * login for a suspended school, but that's the only place is_active was
 * ever checked. A token issued before deactivation kept working against
 * every route indefinitely (until its own TTL expiry), which is a much
 * larger loophole for deactivation than for license expiry — a
 * deactivated school is meant to be fully cut off, not just blocked from
 * signing in again. super_admin is exempt entirely: they're the one role
 * that can reactivate a school, so they can't be locked out of it.
 */
class EnsureSchoolActive
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (! $user || $user->role->value === 'super_admin') {
            return $next($request);
        }

        if ($user->school && ! $user->school->is_active) {
            throw new SchoolSuspendedException();
        }

        return $next($request);
    }
}
