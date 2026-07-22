<?php

namespace App\Modules\Attendance\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ScanRequest extends FormRequest
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
            'barcode_value' => ['required', 'string', 'max:255'],
            'gate_device_id' => ['nullable', 'integer', Rule::exists('gate_devices', 'id')],
        ];
    }
}
