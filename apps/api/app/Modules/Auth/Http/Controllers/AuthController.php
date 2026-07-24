<?php

namespace App\Modules\Auth\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Modules\Auth\Http\Requests\LoginRequest;
use App\Modules\Auth\Services\AuthService;
use App\Support\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
        );

        return ApiResponse::success([
            'user' => new UserResource($result['user']->load(['school', 'activeSchool'])),
            'token' => $result['token'],
        ], 'Logged in successfully.');
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
}
