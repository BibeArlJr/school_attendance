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
            'mobile' => ['nullable', 'string', 'max:50'],
            'dob_bs' => ['nullable', 'string', 'max:20'],
            'address' => ['nullable', 'string', 'max:255'],
            'citizenship_number' => ['nullable', 'string', 'max:100'],
            'designation' => ['nullable', 'string', 'max:255'],
            'rank' => ['nullable', 'string', 'max:255'],
            'sheet_roll_no' => ['nullable', 'string', 'max:100'],
            'level' => ['nullable', 'string', 'max:255'],
        ];
    }
}
