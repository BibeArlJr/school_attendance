<?php

namespace App\Modules\Settings\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAttendanceConfigRequest extends FormRequest
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
            'start_time' => ['required', 'date_format:H:i:s,H:i'],
            'end_time' => ['required', 'date_format:H:i:s,H:i', 'after:start_time'],
            'late_threshold_minutes' => ['required', 'integer', 'min:0', 'max:240'],
            'early_departure_threshold_minutes' => ['required', 'integer', 'min:0', 'max:240'],
            'duplicate_scan_window_seconds' => ['required', 'integer', 'min:0', 'max:3600'],
            'working_days' => ['required', 'array', 'min:1'],
            'working_days.*' => ['integer', 'min:0', 'max:6', 'distinct'],
        ];
    }
}
