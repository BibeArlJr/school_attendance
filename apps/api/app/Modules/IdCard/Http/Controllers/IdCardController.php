<?php

namespace App\Modules\IdCard\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Resources\IdCardResource;
use App\Modules\IdCard\Models\IdCard;
use App\Modules\IdCard\Services\IdCardService;
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
     * One row per student — their current (latest) card, whatever its
     * status — not a full historical log of every past reissue.
     */
    public function index(Request $request): JsonResponse
    {
        $schoolId = $this->schoolResolver->resolve($request->user());

        $latestIdsPerOwner = IdCard::query()
            ->selectRaw('MAX(id) as id')
            ->where('school_id', $schoolId)
            ->where('owner_type', 'student')
            ->groupBy('owner_id');

        $query = IdCard::query()
            ->whereIn('id', $latestIdsPerOwner)
            ->with('owner.schoolClass');

        if ($search = trim((string) $request->query('search', ''))) {
            $query->where(function ($outer) use ($search) {
                $outer->where('barcode_value', 'ilike', "%{$search}%")
                    ->orWhereHasMorph('owner', [Student::class], function ($inner) use ($search) {
                        $inner->where('first_name', 'ilike', "%{$search}%")
                            ->orWhere('last_name', 'ilike', "%{$search}%")
                            ->orWhere('admission_no', 'ilike', "%{$search}%");
                    });
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

        return ApiResponse::success(new IdCardResource($card->load('owner.schoolClass')));
    }

    public function reissue(Student $student): JsonResponse
    {
        $card = $this->idCardService->reissue($student);

        return ApiResponse::success(
            new IdCardResource($card->load('owner.schoolClass')),
            'ID card reissued successfully.',
        );
    }
}
