<?php

use App\Http\Middleware\EnsureLicenseActive;
use App\Support\Exceptions\LicenseExpiredException;
use App\Support\Exceptions\NoActiveSchoolSelectedException;
use App\Support\Responses\ApiResponse;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // This is an API-only backend — there is no HTML login page.
        // Laravel's default redirects unauthenticated guests to a named
        // 'login' route, which doesn't exist here; left unset, that
        // throws RouteNotFoundException (a 500) for any request that
        // doesn't send Accept: application/json. Returning null means
        // "never redirect" regardless of headers, so the request always
        // falls through to the AuthenticationException JSON handling below.
        $middleware->redirectGuestsTo(fn () => null);

        $middleware->alias(['license-active' => EnsureLicenseActive::class]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );

        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*')) {
                return ApiResponse::error('Authentication required.', null, 401);
            }
        });

        // 401 (not authenticated) and 403 (authenticated, not permitted)
        // are distinct failure modes and must stay distinct — see ADR 0003.
        //
        // Gate::authorize() throws Illuminate\Auth\Access\AuthorizationException,
        // but Handler::prepareException() converts it to this Symfony
        // AccessDeniedHttpException *before* render callbacks are checked
        // (unlike AuthenticationException, which isn't converted) — so the
        // callback has to be typed for the converted class to ever match.
        $exceptions->render(function (AccessDeniedHttpException $e, Request $request) {
            if ($request->is('api/*')) {
                return ApiResponse::error($e->getMessage() ?: 'This action is unauthorized.', null, 403);
            }
        });

        // Global, not per-controller: CurrentSchoolResolver is called
        // from dozens of controllers across every module, and this is
        // the only way to cover all of them without touching every call
        // site (Prompt 24). 'code' => 'no_active_school' is what the
        // frontend actually checks to show the "select a school" prompt
        // instead of a generic error toast.
        $exceptions->render(function (NoActiveSchoolSelectedException $e, Request $request) {
            if ($request->is('api/*')) {
                return ApiResponse::error(
                    'Select a school to manage before continuing.',
                    ['code' => 'no_active_school'],
                    409,
                );
            }
        });

        // Graceful degradation, not a lockout (Prompt 25 Part C) — only
        // ever thrown by EnsureLicenseActive on the specific write routes
        // it's attached to, never on reads.
        $exceptions->render(function (LicenseExpiredException $e, Request $request) {
            if ($request->is('api/*')) {
                return ApiResponse::error(
                    "Your school's subscription has expired. Contact your administrator.",
                    ['code' => 'license_expired'],
                    403,
                );
            }
        });
    })->create();
