<?php

namespace App\Modules\ParentGuardian\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Resources\StudentGuardianResource;
use App\Modules\ParentGuardian\Http\Requests\StoreStudentParentLinkRequest;
use App\Modules\ParentGuardian\Models\ParentGuardian;
use App\Modules\ParentGuardian\Services\ParentGuardianLinkService;
use App\Modules\Student\Models\Student;
use App\Support\Responses\ApiResponse;
use App\Support\Services\CurrentSchoolResolver;
use Illuminate\Http\JsonResponse;

/**
 * Guardian-link management from the student side. Lives in the
 * ParentGuardian module (not Student's) because it's gated by
 * access-parents, not access-students — Phase 3's matrix gives Parents no
 * teacher read-tier, unlike Students, so this must never be reachable by
 * anything access-students alone would allow.
 */
class StudentGuardianController extends Controller
{
    public function __construct(
        private readonly CurrentSchoolResolver $schoolResolver,
        private readonly ParentGuardianLinkService $linkService,
    ) {
    }

    public function index(Student $student): JsonResponse
    {
        $links = $student->parentLinks()->with('parentGuardian')->get();

        return ApiResponse::success(StudentGuardianResource::collection($links));
    }

    public function store(StoreStudentParentLinkRequest $request, Student $student): JsonResponse
    {
        $schoolId = $this->schoolResolver->resolve($request->user());

        $link = $this->linkService->link($student, $request->validated(), $schoolId);
        $link->load('parentGuardian');

        return ApiResponse::success(new StudentGuardianResource($link), 'Guardian linked successfully.', 201);
    }

    public function destroy(Student $student, ParentGuardian $parent): JsonResponse
    {
        $this->linkService->unlink($student, $parent);

        return ApiResponse::success(message: 'Guardian unlinked successfully.');
    }

    public function setPrimary(Student $student, ParentGuardian $parent): JsonResponse
    {
        $link = $this->linkService->setPrimary($student, $parent);
        $link->load('parentGuardian');

        return ApiResponse::success(new StudentGuardianResource($link), 'Primary contact updated.');
    }
}
