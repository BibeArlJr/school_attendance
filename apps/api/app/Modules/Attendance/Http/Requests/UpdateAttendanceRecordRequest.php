<?php

namespace App\Modules\Attendance\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAttendanceRecordRequest extends FormRequest
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
            'override_reason' => ['required', 'string', 'max:1000'],
            'in_time' => ['nullable', 'date_format:H:i:s'],
            'out_time' => ['nullable', 'date_format:H:i:s'],
            'status' => ['nullable', Rule::in(['present', 'late', 'absent', 'half_day', 'out_without_in'])],
            'late' => ['nullable', 'boolean'],
            'early_departure' => ['nullable', 'boolean'],
        ];
    }
}
