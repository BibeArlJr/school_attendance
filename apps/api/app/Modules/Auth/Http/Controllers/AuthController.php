<?php

namespace App\Modules\Auth\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Modules\Auth\Http\Requests\ChangePasswordRequest;
use App\Modules\Auth\Http\Requests\LoginRequest;
use App\Modules\Auth\Services\AuthService;
use App\Support\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;

class AuthController extends Controller
{
    public function __construct(private readonly AuthService $authService)
    {
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $result = $this->authService->login(
            $request->validated('email'),
            $request->validated('password'),
            $request->ip(),
        );

        return ApiResponse::success([
            'user' => new UserResource($result['user']->load(['school', 'activeSchool'])),
            'token' => $result['token'],
            'refresh_token' => $result['refresh_token'],
            'expires_at' => $result['expires_at'],
        ], 'Logged in successfully.');
    }

    /**
     * Bearer token here must be a refresh token (ability 'refresh'), not
     * an access token — the global 'access'-ability middleware already lets
     * this route through untouched, so it's this explicit check, not that
     * middleware, that keeps ordinary access tokens from minting fresh
     * pairs and silently extending a session past its intended TTL.
     */
    public function refresh(Request $request): JsonResponse
    {
        /** @var PersonalAccessToken $token */
        $token = $request->user()->currentAccessToken();

        if (! $token->can('refresh')) {
            return ApiResponse::error('Invalid refresh token.', status: 401);
        }

        $result = $this->authService->refresh($request->user(), $token);

        return ApiResponse::success([
            'token' => $result['token'],
            'refresh_token' => $result['refresh_token'],
            'expires_at' => $result['expires_at'],
        ], 'Token refreshed successfully.');
    }

    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout($request->user());

        return ApiResponse::success(message: 'Logged out successfully.');
    }

    public function me(Request $request): JsonResponse
    {
        return ApiResponse::success(
            new UserResource($request->user()->load(['school', 'activeSchool'])),
        );
    }

    /**
     * Self-service, any role (Prompt 25 Part B). The current Sanctum
     * token is deliberately left untouched — PATs aren't derived from or
     * tied to the password hash in any way, so it stays valid after this;
     * there's no auth-mechanism reason to force a re-login.
     */
    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $request->user()->update(['password' => $request->validated('new_password')]);

        return ApiResponse::success(message: 'Password changed successfully.');
    }
}
