<?php

namespace App\Modules\Student\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Student\Http\Requests\StoreStudentRequest;
use App\Modules\Student\Http\Requests\UpdateStudentRequest;
use App\Modules\Student\Http\Requests\UpdateStudentStatusRequest;
use App\Modules\Student\Models\Student;
use App\Modules\Student\Services\StudentService;
use App\Support\Exceptions\DeleteBlockedException;
use App\Support\Responses\ApiResponse;
use App\Support\Services\CurrentSchoolResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    public function __construct(
        private readonly StudentService $studentService,
        private readonly CurrentSchoolResolver $schoolResolver,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $schoolId = $this->schoolResolver->resolve($request->user());

        $query = Student::query()
            ->where('school_id', $schoolId)
            ->with(['schoolClass', 'currentEnrollment', 'primaryParentLink.parentGuardian']);

        if ($search = trim((string) $request->query('search', ''))) {
            $query->where(function ($inner) use ($search) {
                $inner->where('first_name', 'ilike', "%{$search}%")
                    ->orWhere('last_name', 'ilike', "%{$search}%");
            });
        }

        if ($classId = $request->query('class_id')) {
            $query->where('class_id', (int) $classId);
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $students = $query
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->paginate((int) $request->query('per_page', 15))
            ->withQueryString();

        return ApiResponse::success($students);
    }

    public function show(Student $student): JsonResponse
    {
        return ApiResponse::success($student->load(['schoolClass', 'currentEnrollment', 'primaryParentLink.parentGuardian']));
    }

    public function store(StoreStudentRequest $request): JsonResponse
    {
        $schoolId = $this->schoolResolver->resolve($request->user());
        $student = $this->studentService->create($request->validated(), $schoolId);

        return ApiResponse::success($student->load('schoolClass'), 'Student created successfully.', 201);
    }

    public function update(UpdateStudentRequest $request, Student $student): JsonResponse
    {
        $student = $this->studentService->update($student, $request->validated());

        return ApiResponse::success($student->load('schoolClass'), 'Student updated successfully.');
    }

    public function updateStatus(UpdateStudentStatusRequest $request, Student $student): JsonResponse
    {
        $student = $this->studentService->updateStatus($student, $request->validated('status'));

        return ApiResponse::success($student, 'Student status updated successfully.');
    }

    public function destroy(Student $student): JsonResponse
    {
        try {
            $this->studentService->destroy($student);
        } catch (DeleteBlockedException $e) {
            return ApiResponse::error($e->getMessage(), null, 422);
        }

        return ApiResponse::success(null, 'Student deleted successfully.');
    }
}
