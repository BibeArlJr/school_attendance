<?php

namespace App\Modules\BulkSms\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ConfirmBulkSmsUploadRequest extends FormRequest
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
            'file_name' => ['required', 'string', 'max:255'],
            'rows' => ['required', 'array', 'min:1'],
            'rows.*.name' => ['nullable', 'string', 'max:255'],
            // The RAW value from the preview response, not the already-
            // normalized one — the server re-normalizes and re-checks
            // duplicates from scratch here rather than trusting anything
            // the client computed during preview (see
            // BulkSmsUploadService::confirm()).
            'rows.*.phone' => ['required', 'string', 'max:30'],
        ];
    }
}
