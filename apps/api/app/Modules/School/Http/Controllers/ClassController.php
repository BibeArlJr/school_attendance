<?php

namespace App\Modules\School\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\School\Http\Requests\StoreClassRequest;
use App\Modules\School\Http\Requests\UpdateClassRequest;
use App\Modules\School\Models\AcademicYear;
use App\Modules\School\Models\SchoolClass;
use App\Support\Responses\ApiResponse;
use App\Support\Services\CurrentSchoolResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClassController extends Controller
{
    public function __construct(private readonly CurrentSchoolResolver $schoolResolver)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $schoolId = $this->schoolResolver->resolve($request->user());

        $classes = SchoolClass::query()
            ->where('school_id', $schoolId)
            // Column-limited: never expose the full User model (password
            // hash included) over this endpoint. See Prompt 4 deliverable
            // notes — the User model's #[Hidden(...)] attribute does not
            // actually suppress these columns from toArray()/JSON, so
            // relation loads must scope columns explicitly rather than
            // relying on it.
            ->with('classTeacher:id,name,email')
            ->orderBy('name')
            ->orderBy('section')
            ->get();

        return ApiResponse::success($classes);
    }

    public function store(StoreClassRequest $request): JsonResponse
    {
        $schoolId = $this->schoolResolver->resolve($request->user());

        $academicYear = AcademicYear::query()
            ->where('school_id', $schoolId)
            ->where('is_current', true)
            ->firstOrFail();

        $class = SchoolClass::create([
            ...$request->validated(),
            'school_id' => $schoolId,
            'academic_year_id' => $academicYear->id,
        ]);

        return ApiResponse::success($class->load(['classTeacher:id,name,email']), 'Class created successfully.', 201);
    }

    public function update(UpdateClassRequest $request, SchoolClass $class): JsonResponse
    {
        $class->update($request->validated());

        return ApiResponse::success($class->load(['classTeacher:id,name,email']), 'Class updated successfully.');
    }
}
