<?php

namespace App\Modules\BulkSms\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Stage 2's enforced contract, not just convention: 'phone' must be a
 * plain scalar string (the 'string' rule alone already rejects an
 * array/list value outright), and this request explicitly refuses to
 * even look like a bulk-recipient payload — any of the listed keys
 * present and non-empty fails validation before the controller ever
 * runs.
 */
class TestSendBulkSmsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            // Raw, as-typed input — BulkSmsPhoneNormalizer (called from
            // BulkSmsTestSendService) is what actually validates shape
            // and produces the canonical single-recipient form.
            'phone' => ['required', 'string', 'max:30'],
            'message' => ['required', 'string', 'max:1000'],
            // Never accepted here, under any name — this endpoint must
            // never be reachable from a bulk-contact-shaped request.
            'contact_id' => ['prohibited'],
            'contact_ids' => ['prohibited'],
            'upload_id' => ['prohibited'],
            'selected_ids' => ['prohibited'],
            'all' => ['prohibited'],
            'send_all' => ['prohibited'],
        ];
    }
}
