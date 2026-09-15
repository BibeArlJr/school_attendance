<?php

namespace App\Modules\IdCard\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Resources\IdCardResource;
use App\Modules\IdCard\Models\IdCard;
use App\Modules\IdCard\Services\IdCardService;
use App\Modules\Staff\Models\Staff;
use App\Modules\Student\Models\Student;
use App\Support\Responses\ApiResponse;
use App\Support\Services\CurrentSchoolResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IdCardController extends Controller
{
    public function __construct(
        private readonly CurrentSchoolResolver $schoolResolver,
        private readonly IdCardService $idCardService,
    ) {
    }

    /**
     * One row per owner — their current (latest) card, whatever its
     * status — not a full historical log of every past reissue.
     * owner_type defaults to 'student' (unchanged behavior for every
     * existing caller that doesn't pass it) — 'staff' is the only other
     * accepted value.
     */
    public function index(Request $request): JsonResponse
    {
        $schoolId = $this->schoolResolver->resolve($request->user());
        $ownerType = $request->query('owner_type', 'student');

        $latestIdsPerOwner = IdCard::query()
            ->selectRaw('MAX(id) as id')
            ->where('school_id', $schoolId)
            ->where('owner_type', $ownerType)
            ->groupBy('owner_id');

        $query = IdCard::query()->whereIn('id', $latestIdsPerOwner);

        // Staff has no relation worth eager-loading beyond the owner
        // itself — name/designation are plain columns on the row.
        if ($ownerType === 'student') {
            $query->with(['owner.schoolClass', 'owner.currentEnrollment', 'owner.primaryParentLink.parentGuardian']);
        }

        // class_id only applies to students — Staff has no class concept
        // (same guard as AttendanceController's identical filter).
        if ($ownerType === 'student' && ($classId = $request->query('class_id'))) {
            $query->whereHasMorph('owner', [Student::class], function ($inner) use ($classId) {
                $inner->where('class_id', $classId);
            });
        }

        if ($search = trim((string) $request->query('search', ''))) {
            // ILIKE is already case-insensitive at the query-engine level,
            // so this doesn't change matching behavior — but explicit
            // normalization here documents the same intent as
            // AttendanceService's scan-entry normalization (Prompt 51):
            // barcode_value comparisons never depend on the caller's
            // case, by policy, not by accident of which operator happens
            // to be in use.
            $normalizedSearch = strtoupper($search);
            $query->where(function ($outer) use ($search, $normalizedSearch, $ownerType) {
                $outer->where('barcode_value', 'ilike', "%{$normalizedSearch}%");

                if ($ownerType === 'student') {
                    $outer->orWhereHasMorph('owner', [Student::class], function ($inner) use ($search) {
                        $inner->where('first_name', 'ilike', "%{$search}%")
                            ->orWhere('last_name', 'ilike', "%{$search}%");
                    });
                } else {
                    $outer->orWhereHasMorph('owner', [Staff::class], function ($inner) use ($search) {
                        $inner->where('name', 'ilike', "%{$search}%");
                    });
                }
            });
        }

        $cards = $query
            ->orderBy('id')
            ->paginate((int) $request->query('per_page', 15))
            ->withQueryString();

        return ApiResponse::success(
            $cards->setCollection($cards->getCollection()->map(fn (IdCard $card) => new IdCardResource($card))),
        );
    }

    public function show(Student $student): JsonResponse
    {
        $card = $this->idCardService->activeCardFor($student);

        if (! $card) {
            return ApiResponse::error('No ID card found for this student.', null, 404);
        }

        return ApiResponse::success(new IdCardResource($card->load(['owner.schoolClass', 'owner.currentEnrollment', 'owner.primaryParentLink.parentGuardian'])));
    }

    public function reissue(Student $student): JsonResponse
    {
        $card = $this->idCardService->reissue($student);

        return ApiResponse::success(
            new IdCardResource($card->load(['owner.schoolClass', 'owner.currentEnrollment', 'owner.primaryParentLink.parentGuardian'])),
            'ID card reissued successfully.',
        );
    }
}
