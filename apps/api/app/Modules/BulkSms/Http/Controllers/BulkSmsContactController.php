<?php

namespace App\Modules\BulkSms\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Resources\BulkSmsContactResource;
use App\Modules\BulkSms\Http\Requests\StoreBulkSmsContactRequest;
use App\Modules\BulkSms\Http\Requests\UpdateBulkSmsContactRequest;
use App\Modules\BulkSms\Models\BulkSmsContact;
use App\Modules\BulkSms\Services\BulkSmsContactService;
use App\Support\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * platform-admin gated (see routes.php) — super_admin only, same tier as
 * Platform Console. No school context anywhere in this controller: this
 * data has no tenant to scope to.
 */
class BulkSmsContactController extends Controller
{
    public function __construct(private readonly BulkSmsContactService $contactService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $query = BulkSmsContact::query();

        if ($search = trim((string) $request->query('search', ''))) {
            $query->where(function ($inner) use ($search) {
                $inner->where('name', 'ilike', "%{$search}%")
                    ->orWhere('phone', 'ilike', "%{$search}%");
            });
        }

        $contacts = $query
            ->orderByDesc('id')
            ->paginate((int) $request->query('per_page', 15))
            ->withQueryString();

        return ApiResponse::success(
            $contacts->setCollection($contacts->getCollection()->map(fn (BulkSmsContact $c) => new BulkSmsContactResource($c))),
        );
    }

    public function store(StoreBulkSmsContactRequest $request): JsonResponse
    {
        try {
            $contact = $this->contactService->create($request->validated(), $request->user()?->id);
        } catch (ValidationException $e) {
            // Converted to ApiResponse::error() here rather than letting
            // Laravel's default ValidationException rendering through —
            // that shape puts the specific reason (BulkSmsPhoneNormalizer's
            // message, or the duplicate-phone message) only under
            // errors.phone[0], not the top-level `message` field the
            // frontend's extractErrorMessage() actually reads, which
            // would otherwise surface as a generic "invalid data" toast.
            return ApiResponse::error($e->errors()['phone'][0] ?? $e->getMessage(), $e->errors(), 422);
        }

        return ApiResponse::success(new BulkSmsContactResource($contact), 'Contact added successfully.', 201);
    }

    public function update(UpdateBulkSmsContactRequest $request, BulkSmsContact $bulkSmsContact): JsonResponse
    {
        try {
            $contact = $this->contactService->update($bulkSmsContact, $request->validated());
        } catch (ValidationException $e) {
            return ApiResponse::error($e->errors()['phone'][0] ?? $e->getMessage(), $e->errors(), 422);
        }

        return ApiResponse::success(new BulkSmsContactResource($contact), 'Contact updated successfully.');
    }

    public function destroy(BulkSmsContact $bulkSmsContact): JsonResponse
    {
        $this->contactService->destroy($bulkSmsContact);

        return ApiResponse::success(null, 'Contact deleted successfully.');
    }
}
