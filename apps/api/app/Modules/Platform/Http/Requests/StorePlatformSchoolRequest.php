<?php

namespace App\Modules\Platform\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePlatformSchoolRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Normalizes school_code BEFORE validation runs, not just before
     * save — a real production incident traced back to a school_code
     * entered in lowercase ("bindhya"), which then got embedded verbatim
     * into every barcode issued for that school and broke the
     * case-insensitive scan matching that assumes storage is always
     * uppercase. Doing this here (not only in PlatformSchoolService,
     * which also normalizes independently as defense in depth) means the
     * `unique:schools,school_code` rule below checks the actual
     * to-be-stored value, so "bindhya" and "BINDHYA" collide as
     * duplicates at validation time instead of silently both slipping
     * through as if they were different codes.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('school_code')) {
            $this->merge(['school_code' => mb_strtoupper(trim((string) $this->input('school_code')))]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'school_code' => ['required', 'string', 'max:50', 'unique:schools,school_code'],
            'name' => ['required', 'string', 'max:255'],
            'contact_email' => ['nullable', 'email', 'max:255'],
            'contact_phone' => ['nullable', 'string', 'max:50'],
            'admin_name' => ['required', 'string', 'max:255'],
            'admin_email' => ['required', 'email', 'max:255', 'unique:users,email'],
            // Optional (Prompt 33 Part B): without it, this admin simply
            // won't receive license-reminder SMS — reminders skip admins
            // with no phone on file rather than failing.
            'admin_phone' => ['nullable', 'string', 'max:50'],
        ];
    }
}
