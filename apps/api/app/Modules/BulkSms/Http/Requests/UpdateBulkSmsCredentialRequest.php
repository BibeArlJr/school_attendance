<?php

namespace App\Modules\BulkSms\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBulkSmsCredentialRequest extends FormRequest
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
            'token' => ['required', 'string', 'max:255'],
            'sender_id' => ['required', 'string', 'max:50'],
        ];
    }
}
