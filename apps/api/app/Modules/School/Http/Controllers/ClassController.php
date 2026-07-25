<?php

namespace App\Modules\School\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\School\Http\Requests\StoreClassRequest;
use App\Modules\School\Http\Requests\UpdateClassRequest;
use App\Modules\School\Models\SchoolClass;
use App\Modules\School\Services\SchoolClassService;
use App\Support\Exceptions\DeleteBlockedException;
use App\Support\Responses\ApiResponse;
use App\Support\Services\CurrentSchoolResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClassController extends Controller
{
    public function __construct(
        private readonly CurrentSchoolResolver $schoolResolver,
        private readonly SchoolClassService $classService,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $schoolId = $this->schoolResolver->resolve($request->user());

        $classes = SchoolClass::query()
            ->where('school_id', $schoolId)
            ->withCount(['students as active_students_count' => fn ($q) => $q->where('status', 'active')])
            // grade_level ASC puts NULLs last by Postgres's default sort
            // behavior — classes without an inferable grade level fall
            // back to alphabetical among themselves, after the graded
            // ones, rather than being interleaved with them.
            ->orderBy('grade_level')
            ->orderBy('name')
            ->orderBy('section')
            ->get();

        return ApiResponse::success($classes);
    }

    public function store(StoreClassRequest $request): JsonResponse
    {
        $schoolId = $this->schoolResolver->resolve($request->user());
        $class = $this->classService->create($request->validated(), $schoolId);

        return ApiResponse::success(self::withCount($class), 'Class created successfully.', 201);
    }

    public function update(UpdateClassRequest $request, SchoolClass $class): JsonResponse
    {
        $class->update($request->validated());

        return ApiResponse::success(self::withCount($class), 'Class updated successfully.');
    }

    public function destroy(SchoolClass $class): JsonResponse
    {
        try {
            $this->classService->destroy($class);
        } catch (DeleteBlockedException $e) {
            return ApiResponse::error($e->getMessage(), null, 422);
        }

        return ApiResponse::success(null, 'Class deleted successfully.');
    }

    private static function withCount(SchoolClass $class): SchoolClass
    {
        $class->loadCount(['students as active_students_count' => fn ($q) => $q->where('status', 'active')]);

        return $class;
    }
}
