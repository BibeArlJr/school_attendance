<?php

namespace App\Modules\Student\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStudentRequest extends FormRequest
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
            // Prompt 28: BsDatePicker on the frontend always sends both —
            // dob (converted Gregorian, still the field every date
            // comparison/attendance calculation reads) and dob_bs (the BS
            // value as entered, kept only for display). Nullable here
            // because import (a separate path, not this request) is the
            // one existing case where dob_bs is set without dob.
            'dob_bs' => ['nullable', 'string', 'max:20'],
            // Nullable, not required (Prompt 47 Part B) — removed from the
            // Add Student form entirely; the column itself was already
            // nullable for bulk-imported students, who never had this
            // collected in the first place (nearly all existing students
            // have a null gender today for exactly that reason).
            'gender' => ['nullable', Rule::in(['male', 'female', 'other'])],
            'admission_date' => ['required', 'date'],
            'roll_no' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:500'],
        ];
    }
}
