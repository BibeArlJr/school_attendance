<?php

namespace App\Modules\Staff\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Resources\IdCardResource;
use App\Http\Resources\StaffResource;
use App\Modules\IdCard\Services\IdCardService;
use App\Modules\Staff\Http\Requests\StoreStaffRequest;
use App\Modules\Staff\Http\Requests\UpdateStaffEmploymentStatusRequest;
use App\Modules\Staff\Http\Requests\UpdateStaffRequest;
use App\Modules\Staff\Models\Staff;
use App\Modules\Staff\Services\StaffService;
use App\Support\Exceptions\DeleteBlockedException;
use App\Support\Responses\ApiResponse;
use App\Support\Services\CurrentSchoolResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StaffController extends Controller
{
    public function __construct(
        private readonly StaffService $staffService,
        private readonly IdCardService $idCardService,
        private readonly CurrentSchoolResolver $schoolResolver,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $schoolId = $this->schoolResolver->resolve($request->user());

        $query = Staff::query()->where('school_id', $schoolId);

        if ($search = trim((string) $request->query('search', ''))) {
            $query->where(function ($inner) use ($search) {
                $inner->where('name', 'ilike', "%{$search}%")
                    ->orWhere('designation', 'ilike', "%{$search}%")
                    ->orWhere('citizenship_number', 'ilike', "%{$search}%");
            });
        }

        if ($employmentStatus = $request->query('employment_status')) {
            $query->where('employment_status', $employmentStatus);
        }

        $staff = $query
            ->orderBy('name')
            ->paginate((int) $request->query('per_page', 15))
            ->withQueryString();

        return ApiResponse::success(
            $staff->setCollection($staff->getCollection()->map(fn (Staff $s) => new StaffResource($s))),
        );
    }

    public function store(StoreStaffRequest $request): JsonResponse
    {
        $schoolId = $this->schoolResolver->resolve($request->user());

        $staff = $this->staffService->create($request->validated(), $schoolId);

        return ApiResponse::success(new StaffResource($staff), 'Staff member created successfully.', 201);
    }

    public function show(Staff $staff): JsonResponse
    {
        return ApiResponse::success(new StaffResource($staff));
    }

    public function update(UpdateStaffRequest $request, Staff $staff): JsonResponse
    {
        $staff = $this->staffService->update($staff, $request->validated());

        return ApiResponse::success(new StaffResource($staff), 'Staff member updated successfully.');
    }

    public function updateEmploymentStatus(UpdateStaffEmploymentStatusRequest $request, Staff $staff): JsonResponse
    {
        $staff = $this->staffService->updateEmploymentStatus($staff, $request->validated('employment_status'));

        return ApiResponse::success(new StaffResource($staff), 'Employment status updated successfully.');
    }

    public function idCard(Staff $staff): JsonResponse
    {
        $card = $this->idCardService->activeCardForStaff($staff);

        if (! $card) {
            return ApiResponse::error('No ID card found for this staff member.', null, 404);
        }

        return ApiResponse::success(new IdCardResource($card->load('owner')));
    }

    public function reissueIdCard(Staff $staff): JsonResponse
    {
        $card = $this->idCardService->reissueForStaff($staff);

        return ApiResponse::success(
            new IdCardResource($card->load('owner')),
            'ID card reissued successfully.',
        );
    }

    public function destroy(Staff $staff): JsonResponse
    {
        try {
            $this->staffService->destroy($staff);
        } catch (DeleteBlockedException $e) {
            return ApiResponse::error($e->getMessage(), null, 422);
        }

        return ApiResponse::success(null, 'Staff member deleted successfully.');
    }
}
