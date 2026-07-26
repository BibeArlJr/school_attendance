<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Sentry\Laravel\Facade as Sentry;
use Sentry\State\Scope;
use Symfony\Component\HttpFoundation\Response;

/**
 * Attaches request-level context to whatever Sentry captures downstream
 * (Prompt 45) — school_id and the authenticated user's role, nothing
 * more. Deliberately not the user's name/email/phone: send_default_pii
 * already defaults to false in config/sentry.php, and this middleware
 * must not reintroduce PII through a side door.
 *
 * A no-op with no SENTRY_LARAVEL_DSN configured — Sentry::configureScope()
 * is safe to call even when the SDK never initialized (the underlying
 * client is a no-op client in that case), so this never needs its own
 * "is Sentry enabled" check.
 */
class SentryContext
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user) {
            Sentry::configureScope(function (Scope $scope) use ($user): void {
                $scope->setTag('role', $user->role->value);
                // Regular users: their own school. super_admin: whichever
                // school they've selected as active, if any — same
                // resolution CurrentSchoolResolver uses, but read
                // directly rather than through it, since this is
                // best-effort observability context, not a security
                // gate, and must never itself throw
                // NoActiveSchoolSelectedException.
                $schoolId = $user->school_id ?? $user->active_school_id;
                if ($schoolId !== null) {
                    $scope->setTag('school_id', (string) $schoolId);
                }
            });
        }

        return $next($request);
    }
}
