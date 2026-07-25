<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Baseline security response headers (Prompt 41) — nothing set any of
 * these before. This is a pure JSON API (no server-rendered HTML view
 * ever responds here), so the policy is deliberately the strictest
 * possible rather than tuned for a page that needs to load its own
 * scripts/styles/frames.
 */
class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
        $response->headers->set('Referrer-Policy', 'no-referrer');

        return $response;
    }
}
