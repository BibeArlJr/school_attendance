<?php

namespace App\Http\Middleware;

use App\Support\Responses\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Guards POST /api/tasks/* (Prompt 55 Part E). These endpoints exist
 * only because Render's Cron Jobs feature isn't free-tier eligible — an
 * external cron-ping service (or a GitHub Actions scheduled workflow)
 * hits them on a schedule instead of a real server-side cron running
 * `artisan schedule:run`. Not session/token auth (the caller is an
 * external ping service, not a logged-in user) — a shared secret sent
 * as a header and compared with hash_equals to avoid a timing side
 * channel.
 */
class VerifyScheduledTaskSecret
{
    public function handle(Request $request, Closure $next): Response
    {
        $configured = config('services.scheduled_tasks.secret');
        $provided = $request->header('X-Scheduled-Task-Secret');

        // No configured secret means "not set up yet", never "open to
        // anyone" — reject even a request with a matching-by-coincidence
        // empty header rather than treating an unconfigured secret as a
        // wildcard.
        if (! is_string($configured) || $configured === '' || ! is_string($provided) || ! hash_equals($configured, $provided)) {
            return ApiResponse::error('Unauthorized.', null, 401);
        }

        return $next($request);
    }
}
