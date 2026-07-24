<?php

namespace App\Modules\Auth\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ChangePasswordRequest extends FormRequest
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
            // Laravel's built-in `current_password` rule checks against
            // the authenticated user's actual password hash — no need to
            // hand-roll a Hash::check().
            'current_password' => ['required', 'current_password'],
            'new_password' => ['required', 'string', 'min:8'],
        ];
    }
}
