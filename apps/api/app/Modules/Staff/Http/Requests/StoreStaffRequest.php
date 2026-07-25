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
            // Prompt 26: generalizes teacher-only creation to also cover
            // guard — the login (User.role) and staff profile creation
            // flow is identical either way, just parameterized here
            // instead of StaffService hardcoding UserRole::Teacher.
            'role' => ['required', 'in:teacher,guard'],
            'designation' => ['required', 'string', 'max:255'],
            'qualification' => ['nullable', 'string', 'max:255'],
            'joined_date' => ['required', 'date'],
        ];
    }
}
