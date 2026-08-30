<?php

namespace App\Modules\Users\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserAccountResource;
use App\Modules\Users\Http\Requests\StoreUserRequest;
use App\Modules\Users\Http\Requests\UpdateEmploymentStatusRequest;
use App\Modules\Users\Http\Requests\UpdateUserRequest;
use App\Modules\Users\Models\UserAccount;
use App\Modules\Users\Services\UserAccountService;
use App\Support\Exceptions\DeleteBlockedException;
use App\Support\Responses\ApiResponse;
use App\Support\Services\CurrentSchoolResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Renamed from StaffController (Staff -> Users) — manages admin/guard
 * LOGIN accounts only, same function as before the rename, nothing
 * else changed here. idCard/reissueIdCard were deliberately dropped in
 * this rename, not just renamed: they were already dead code (no UI
 * ever reached them since the original teacher-removal), and
 * IdCardService's staff-card methods now belong exclusively to the new
 * HR-domain Staff model (App\Modules\Staff), not this one — an admin/
 * guard login account was never meant to carry a scannable ID card.
 */
class UserController extends Controller
{
    public function __construct(
        private readonly UserAccountService $userAccountService,
        private readonly CurrentSchoolResolver $schoolResolver,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $schoolId = $this->schoolResolver->resolve($request->user());

        $query = UserAccount::query()->where('school_id', $schoolId)->with('user');

        if ($search = trim((string) $request->query('search', ''))) {
            $query->where(function ($outer) use ($search) {
                $outer->where('designation', 'ilike', "%{$search}%")
                    ->orWhereHas('user', function ($inner) use ($search) {
                        $inner->where('name', 'ilike', "%{$search}%");
                    });
            });
        }

        if ($employmentStatus = $request->query('employment_status')) {
            $query->where('employment_status', $employmentStatus);
        }

        // Prompt 26: this list now covers both teacher and guard staff —
        // an optional role filter narrows it back down for callers that
        // only want one (e.g. the class-teacher picker).
        if ($role = $request->query('role')) {
            $query->whereHas('user', fn ($inner) => $inner->where('role', $role));
        }

        $accounts = $query
            ->orderBy('id')
            ->paginate((int) $request->query('per_page', 15))
            ->withQueryString();

        return ApiResponse::success(
            $accounts->setCollection($accounts->getCollection()->map(fn (UserAccount $a) => new UserAccountResource($a))),
        );
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $schoolId = $this->schoolResolver->resolve($request->user());

        $result = $this->userAccountService->create($request->validated(), $schoolId);

        return ApiResponse::success([
            'staff' => new UserAccountResource($result['staff']),
            'temporary_password' => $result['temporary_password'],
        ], 'User account created successfully.', 201);
    }

    public function show(UserAccount $userAccount): JsonResponse
    {
        return ApiResponse::success(new UserAccountResource($userAccount->load('user')));
    }

    public function update(UpdateUserRequest $request, UserAccount $userAccount): JsonResponse
    {
        $userAccount = $this->userAccountService->update($userAccount, $request->validated());

        return ApiResponse::success(new UserAccountResource($userAccount), 'User account updated successfully.');
    }

    public function updateEmploymentStatus(UpdateEmploymentStatusRequest $request, UserAccount $userAccount): JsonResponse
    {
        $userAccount = $this->userAccountService->updateEmploymentStatus($userAccount, $request->validated('employment_status'));

        return ApiResponse::success(new UserAccountResource($userAccount), 'Employment status updated successfully.');
    }

    public function resetPassword(UserAccount $userAccount): JsonResponse
    {
        $temporaryPassword = $this->userAccountService->resetPassword($userAccount);

        return ApiResponse::success(
            ['temporary_password' => $temporaryPassword],
            'Password reset successfully.',
        );
    }

    public function destroy(UserAccount $userAccount): JsonResponse
    {
        try {
            $this->userAccountService->destroy($userAccount);
        } catch (DeleteBlockedException $e) {
            return ApiResponse::error($e->getMessage(), null, 422);
        }

        return ApiResponse::success(null, 'User account deleted successfully.');
    }
}
