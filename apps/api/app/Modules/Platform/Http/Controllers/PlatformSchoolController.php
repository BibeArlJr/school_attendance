<?php

namespace App\Modules\Platform\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Platform\Http\Requests\StorePlatformSchoolRequest;
use App\Modules\Platform\Services\PlatformSchoolService;
use App\Modules\School\Models\School;
use App\Support\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PlatformSchoolController extends Controller
{
    public function __construct(private readonly PlatformSchoolService $schoolService)
    {
    }

    /**
     * Every school on the platform — not scoped by CurrentSchoolResolver
     * at all, deliberately: this is the one place that's meant to see
     * across every tenant at once.
     */
    public function index(): JsonResponse
    {
        $schools = School::query()
            ->withCount([
                'users as staff_count' => fn ($query) => $query->whereIn('role', ['admin', 'teacher', 'guard']),
                'students as students_count' => fn ($query) => $query->where('status', 'active'),
            ])
            ->orderBy('name')
            ->get();

        return ApiResponse::success($schools);
    }

    public function show(School $school): JsonResponse
    {
        $school->loadCount([
            'users as staff_count' => fn ($query) => $query->whereIn('role', ['admin', 'teacher', 'guard']),
            'students as students_count' => fn ($query) => $query->where('status', 'active'),
        ]);

        return ApiResponse::success($school);
    }

    public function store(StorePlatformSchoolRequest $request): JsonResponse
    {
        $result = $this->schoolService->create($request->validated());

        return ApiResponse::success([
            'school' => $result['school'],
            'admin_email' => $result['admin']->email,
            'temporary_password' => $result['temporary_password'],
        ], 'School created successfully.', 201);
    }

    /**
     * Sets the session-equivalent "which school am I looking at" for a
     * super_admin — persisted on their own user row (active_school_id),
     * not a PHP session (this API is stateless Bearer-token auth, ADR
     * 0002 — no cookie-based session middleware on the api routes for a
     * plain session() call to reliably persist against).
     */
    public function setActive(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'school_id' => ['required', 'integer', Rule::exists('schools', 'id')],
        ]);

        $user = $request->user();
        $user->update(['active_school_id' => $validated['school_id']]);

        return ApiResponse::success(
            School::query()->findOrFail($validated['school_id']),
            'Active school updated.',
        );
    }
}
