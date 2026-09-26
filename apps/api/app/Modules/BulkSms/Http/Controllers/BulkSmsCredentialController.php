<?php

namespace App\Modules\BulkSms\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Resources\BulkSmsProviderConfigResource;
use App\Modules\BulkSms\Http\Requests\UpdateBulkSmsCredentialRequest;
use App\Modules\BulkSms\Models\BulkSmsProviderConfig;
use App\Modules\BulkSms\Services\BulkSmsCredentialService;
use App\Modules\BulkSms\Services\BulkSparrowSmsService;
use App\Support\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;

/**
 * platform-admin gated (see routes.php) — reads/writes ONLY
 * bulk_sms_provider_configs, via BulkSmsCredentialService. Never touches
 * App\Modules\Sms\Models\SmsProviderConfig.
 */
class BulkSmsCredentialController extends Controller
{
    public function __construct(
        private readonly BulkSmsCredentialService $credentialService,
        private readonly BulkSparrowSmsService $sparrowService,
    ) {
    }

    public function show(): JsonResponse
    {
        $config = $this->credentialService->getConfig() ?? new BulkSmsProviderConfig();

        return ApiResponse::success(new BulkSmsProviderConfigResource($config));
    }

    public function update(UpdateBulkSmsCredentialRequest $request): JsonResponse
    {
        $config = $this->credentialService->update(
            $request->validated('token'),
            $request->validated('sender_id'),
            $request->user()?->id,
        );

        return ApiResponse::success(new BulkSmsProviderConfigResource($config), 'Bulk SMS credential saved.');
    }

    /**
     * "Check Connection" and "Check Credits" both call this — a
     * read-only credit-balance check, never an SMS send, under any
     * driver mode (see BulkSparrowSmsService::getCredits()).
     */
    public function credits(): JsonResponse
    {
        return ApiResponse::success([
            ...$this->sparrowService->getCredits(),
            'driver' => config('services.bulk_sms.driver'),
        ]);
    }
}
