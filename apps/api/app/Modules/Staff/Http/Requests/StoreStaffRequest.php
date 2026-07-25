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
            // guard and (Part A addendum) admin — the login (User.role)
            // and staff profile creation flow is identical for all
            // three, just parameterized here instead of StaffService
            // hardcoding UserRole::Teacher. admin is included so a
            // school isn't permanently limited to the single admin
            // auto-created at school-creation time (Prompt 24) — there
            // was previously no way to add a second one.
            'role' => ['required', 'in:teacher,guard,admin'],
            'designation' => ['required', 'string', 'max:255'],
            'qualification' => ['nullable', 'string', 'max:255'],
            'joined_date' => ['required', 'date'],
        ];
    }
}
