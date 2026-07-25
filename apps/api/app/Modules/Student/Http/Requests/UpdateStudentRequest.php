<?php

namespace App\Modules\Student\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStudentRequest extends FormRequest
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
            'class_id' => ['required', 'integer', Rule::exists('classes', 'id')],
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'dob' => ['required', 'date', 'before:today'],
            // Prompt 28: see StoreStudentRequest's comment — BsDatePicker
            // always sends both dob and dob_bs together.
            'dob_bs' => ['nullable', 'string', 'max:20'],
            'gender' => ['required', Rule::in(['male', 'female', 'other'])],
            'admission_date' => ['required', 'date'],
        ];
    }
}
