<?php

namespace App\Modules\School\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreClassRequest extends FormRequest
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
            'section' => ['nullable', 'string', 'max:50'],
            // Plain text, not an FK (Prompt 35 Part F) — class_teacher_id
            // was a broken reference once Teacher accounts stopped
            // existing (Prompt 34); nothing to validate against anymore.
            'class_teacher_name' => ['nullable', 'string', 'max:255'],
        ];
    }
}
