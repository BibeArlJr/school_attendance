<?php

namespace App\Modules\BulkSms\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Resources\BulkSmsSendLogResource;
use App\Modules\BulkSms\Exceptions\BulkSmsTestSendThrottledException;
use App\Modules\BulkSms\Http\Requests\TestSendBulkSmsRequest;
use App\Modules\BulkSms\Services\BulkSmsTestSendService;
use App\Support\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

/**
 * Stage 2's critical safety boundary. This controller — and everything
 * it calls (BulkSmsTestSendService, BulkSmsPhoneNormalizer,
 * BulkSparrowSmsService) — never imports, queries, or references
 * App\Modules\BulkSms\Models\BulkSmsContact or BulkSmsUpload. There is
 * no code path from this endpoint to any of the stored bulk contacts.
 */
class BulkSmsTestSendController extends Controller
{
    public function __construct(private readonly BulkSmsTestSendService $testSendService)
    {
    }

    public function store(TestSendBulkSmsRequest $request): JsonResponse
    {
        try {
            $log = $this->testSendService->send(
                $request->validated('phone'),
                $request->validated('message'),
                $request->user()?->id,
            );
        } catch (ValidationException $e) {
            return ApiResponse::error($e->errors()['phone'][0] ?? $e->getMessage(), $e->errors(), 422);
        } catch (BulkSmsTestSendThrottledException $e) {
            return ApiResponse::error($e->getMessage(), ['code' => 'test_send_throttled'], 429);
        }

        return ApiResponse::success(new BulkSmsSendLogResource($log), 'Test SMS attempt recorded.');
    }
}
