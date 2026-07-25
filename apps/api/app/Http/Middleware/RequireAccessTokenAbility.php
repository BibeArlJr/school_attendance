<?php

namespace App\Http\Middleware;

use App\Support\Responses\ApiResponse;
use Closure;
use Illuminate\Http\Request;

/**
 * Global companion to the access/refresh token split (Prompt 31 Part A):
 * a refresh token must only ever be usable against POST /auth/refresh,
 * never as a Bearer token against any business endpoint — otherwise a
 * stolen refresh token would be just as dangerous as a stolen access
 * token, defeating the point of having two token types. Registered on
 * the global 'api' middleware group so no per-route changes were needed.
 *
 * Sanctum resolves $request->user() lazily from the Bearer token itself
 * (see Laravel\Sanctum\Guard::__invoke), independent of whether the
 * per-route `auth:sanctum` middleware has already run — so this is safe
 * to check here regardless of pipeline ordering. Unauthenticated
 * requests (no user resolved) are left untouched; `auth:sanctum` on the
 * protected routes still rejects those as it always has.
 */
class RequireAccessTokenAbility
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (! $user) {
            return $next($request);
        }

        $token = $user->currentAccessToken();

        if (! $token) {
            return $next($request);
        }

        $requiredAbility = $request->routeIs('auth.refresh') ? 'refresh' : 'access';

        if (! $token->can($requiredAbility)) {
            return ApiResponse::error('Invalid or expired token.', status: 401);
        }

        return $next($request);
    }
}
