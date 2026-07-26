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
            // Nullable, not required (Prompt 47 Part B, mirroring
            // StoreStudentRequest) — ~99% of existing students already
            // have a null gender (bulk import never collected it either).
            // Editing one of those without touching the (now-optional)
            // Gender select must not fail validation just because this
            // field is untouched.
            'gender' => ['nullable', Rule::in(['male', 'female', 'other'])],
            'admission_date' => ['required', 'date'],
            // Added Prompt 47 — Edit previously silently dropped both:
            // roll_no isn't a students-table column at all (see
            // StudentService::update()), and address, while a real
            // column, was never in this request's rules.
            'roll_no' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:500'],
        ];
    }
}
