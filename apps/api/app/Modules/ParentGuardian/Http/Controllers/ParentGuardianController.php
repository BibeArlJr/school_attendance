<?php

namespace App\Modules\ParentGuardian\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Resources\ParentGuardianResource;
use App\Modules\ParentGuardian\Http\Requests\StoreParentGuardianRequest;
use App\Modules\ParentGuardian\Http\Requests\UpdateParentGuardianRequest;
use App\Modules\ParentGuardian\Models\ParentGuardian;
use App\Modules\ParentGuardian\Services\ParentGuardianLinkService;
use App\Support\Responses\ApiResponse;
use App\Support\Services\CurrentSchoolResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ParentGuardianController extends Controller
{
    public function __construct(
        private readonly CurrentSchoolResolver $schoolResolver,
        private readonly ParentGuardianLinkService $linkService,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $schoolId = $this->schoolResolver->resolve($request->user());

        $query = ParentGuardian::query()->where('school_id', $schoolId)->withCount('links');

        if ($search = trim((string) $request->query('search', ''))) {
            $query->where(function ($inner) use ($search) {
                $inner->where('name', 'ilike', "%{$search}%")
                    ->orWhere('phone', 'ilike', "%{$search}%");
            });
        }

        $parents = $query
            ->orderBy('name')
            ->paginate((int) $request->query('per_page', 15))
            ->withQueryString();

        return ApiResponse::success(
            $parents->setCollection(
                $parents->getCollection()->map(fn (ParentGuardian $parent) => new ParentGuardianResource($parent)),
            ),
        );
    }

    public function search(Request $request): JsonResponse
    {
        $schoolId = $this->schoolResolver->resolve($request->user());
        $match = $this->linkService->findByPhone((string) $request->query('phone', ''), $schoolId);

        return ApiResponse::success($match ? new ParentGuardianResource($match) : null);
    }

    public function show(ParentGuardian $parent): JsonResponse
    {
        $parent->load(['links.student.schoolClass']);

        return ApiResponse::success(new ParentGuardianResource($parent));
    }

    public function store(StoreParentGuardianRequest $request): JsonResponse
    {
        $schoolId = $this->schoolResolver->resolve($request->user());

        $parent = ParentGuardian::create([
            ...$request->validated(),
            'school_id' => $schoolId,
        ]);

        return ApiResponse::success(new ParentGuardianResource($parent), 'Parent created successfully.', 201);
    }

    public function update(UpdateParentGuardianRequest $request, ParentGuardian $parent): JsonResponse
    {
        $parent->update($request->validated());

        return ApiResponse::success(new ParentGuardianResource($parent), 'Parent updated successfully.');
    }
}
