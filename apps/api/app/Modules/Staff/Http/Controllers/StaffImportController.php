<?php

namespace App\Modules\Staff\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Resources\ImportBatchResource;
use App\Modules\Import\Http\Requests\StoreImportRequest;
use App\Modules\Import\Models\ImportBatch;
use App\Modules\Staff\Http\Requests\CommitStaffImportRequest;
use App\Modules\Staff\Services\StaffImportCommitService;
use App\Modules\Staff\Services\StaffImportParsingService;
use App\Support\Exceptions\ImportBatchAlreadyCommittedException;
use App\Support\Responses\ApiResponse;
use App\Support\Services\CurrentSchoolResolver;
use Illuminate\Http\JsonResponse;

/**
 * Same parse -> review -> commit shape as StudentImportController,
 * reusing StoreImportRequest and ImportBatchResource as-is (both
 * already entity-agnostic) — only the parsing/commit services and the
 * commit request's row-decision shape are staff-specific.
 */
class StaffImportController extends Controller
{
    public function __construct(
        private readonly StaffImportParsingService $parsingService,
        private readonly StaffImportCommitService $commitService,
        private readonly CurrentSchoolResolver $schoolResolver,
    ) {
    }

    public function store(StoreImportRequest $request): JsonResponse
    {
        $schoolId = $this->schoolResolver->resolve($request->user());

        $batch = $this->parsingService->parse(
            $request->file('file'),
            $schoolId,
            $request->user()->id,
        );

        return ApiResponse::success(new ImportBatchResource($batch), 'File parsed successfully.', 201);
    }

    public function show(ImportBatch $batch): JsonResponse
    {
        return ApiResponse::success(new ImportBatchResource($batch->load('rows')));
    }

    public function commit(CommitStaffImportRequest $request, ImportBatch $batch): JsonResponse
    {
        $schoolId = $this->schoolResolver->resolve($request->user());

        $decisions = collect($request->validated('rows'))->keyBy('id')->toArray();

        try {
            $results = $this->commitService->commit($batch, $decisions, $schoolId);
        } catch (ImportBatchAlreadyCommittedException $e) {
            return ApiResponse::error($e->getMessage(), null, 409);
        }

        return ApiResponse::success($results, 'Import committed.');
    }
}
