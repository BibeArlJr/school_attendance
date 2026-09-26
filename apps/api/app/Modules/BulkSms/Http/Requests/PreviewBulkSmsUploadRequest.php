<?php

namespace App\Modules\BulkSms\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PreviewBulkSmsUploadRequest extends FormRequest
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
            // 'extensions', not 'mimes' — a plain .csv is inconsistently
            // reported as text/plain vs text/csv depending on the
            // browser/OS, which makes MIME-sniffing rules like `mimes:`
            // flaky for this specific format; a real, current risk noted
            // during planning, not a hypothetical.
            'file' => ['required', 'file', 'extensions:csv,xls,xlsx', 'max:10240'],
        ];
    }
}
