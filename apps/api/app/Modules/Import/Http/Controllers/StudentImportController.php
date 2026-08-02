<?php

namespace App\Modules\Import\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Resources\ImportBatchResource;
use App\Modules\Import\Http\Requests\CommitImportRequest;
use App\Modules\Import\Http\Requests\StoreImportRequest;
use App\Modules\Import\Models\ImportBatch;
use App\Modules\Import\Services\ImportCommitService;
use App\Modules\Import\Services\ImportParsingService;
use App\Support\Exceptions\ImportBatchAlreadyCommittedException;
use App\Support\Responses\ApiResponse;
use App\Support\Services\CurrentSchoolResolver;
use Illuminate\Http\JsonResponse;

class StudentImportController extends Controller
{
    public function __construct(
        private readonly ImportParsingService $parsingService,
        private readonly ImportCommitService $commitService,
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

    public function commit(CommitImportRequest $request, ImportBatch $batch): JsonResponse
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
