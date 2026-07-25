<?php

namespace App\Modules\Staff\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreStaffRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            // Prompt 26 generalized teacher-only creation to also cover
            // guard and admin; Prompt 34 removes teacher entirely as a
            // creatable role (existing teacher accounts are deactivated,
            // not deleted — see StaffEmploymentStatus::Resigned). admin
            // stays so a school isn't permanently limited to the single
            // admin auto-created at school-creation time (Prompt 24).
            'role' => ['required', 'in:guard,admin'],
            'designation' => ['nullable', 'string', 'max:255'],
        ];
    }
}
