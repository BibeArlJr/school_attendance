<?php

namespace App\Modules\School\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateClassRequest extends FormRequest
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
            'class_teacher_id' => ['nullable', 'integer', Rule::exists('users', 'id')],
        ];
    }
}
