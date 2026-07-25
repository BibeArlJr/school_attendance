<?php

namespace App\Modules\Auth\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

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
            // min(10)+letters+numbers+symbols, no mixedCase(): matches
            // exactly what Str::password() (used for every
            // system-generated password — staff creation, resets) already
            // guarantees, so generated passwords never need special-casing
            // against this same rule (Prompt 31 Part D).
            'new_password' => ['required', 'string', Password::min(10)->letters()->numbers()->symbols()],
        ];
    }
}
