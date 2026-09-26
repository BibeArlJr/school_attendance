<?php

namespace App\Modules\BulkSms\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreBulkSmsContactRequest extends FormRequest
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
            'name' => ['nullable', 'string', 'max:255'],
            // Raw, as-typed input — BulkSmsPhoneNormalizer (called from
            // BulkSmsContactService) is what actually validates shape and
            // produces the canonical form; this only bounds length.
            'phone' => ['required', 'string', 'max:30'],
        ];
    }
}
