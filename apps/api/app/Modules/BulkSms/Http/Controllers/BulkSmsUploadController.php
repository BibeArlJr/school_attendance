<?php

namespace App\Modules\BulkSms\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Resources\BulkSmsUploadResource;
use App\Modules\BulkSms\Http\Requests\ConfirmBulkSmsUploadRequest;
use App\Modules\BulkSms\Http\Requests\PreviewBulkSmsUploadRequest;
use App\Modules\BulkSms\Models\BulkSmsUpload;
use App\Modules\BulkSms\Services\BulkSmsUploadService;
use App\Support\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BulkSmsUploadController extends Controller
{
    public function __construct(private readonly BulkSmsUploadService $uploadService)
    {
    }

    /**
     * Writes nothing at all — parses and validates the file and returns
     * the full row-by-row result directly in the response. Nothing is
     * persisted until confirm() is called with whichever rows the
     * reviewer actually wants imported.
     */
    public function preview(PreviewBulkSmsUploadRequest $request): JsonResponse
    {
        $result = $this->uploadService->preview($request->file('file'));

        return ApiResponse::success($result);
    }

    public function confirm(ConfirmBulkSmsUploadRequest $request): JsonResponse
    {
        $result = $this->uploadService->confirm(
            $request->validated('file_name'),
            $request->validated('rows'),
            $request->user()?->id,
        );

        return ApiResponse::success([
            'upload' => new BulkSmsUploadResource($result['upload']),
            'created' => $result['created'],
            'skipped' => $result['skipped'],
        ], 'Import completed.');
    }

    public function index(Request $request): JsonResponse
    {
        $uploads = BulkSmsUpload::query()
            ->orderByDesc('id')
            ->paginate((int) $request->query('per_page', 15))
            ->withQueryString();

        return ApiResponse::success(
            $uploads->setCollection($uploads->getCollection()->map(fn (BulkSmsUpload $u) => new BulkSmsUploadResource($u))),
        );
    }
}
