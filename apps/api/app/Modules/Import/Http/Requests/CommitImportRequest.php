<?php

namespace App\Modules\Import\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CommitImportRequest extends FormRequest
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
            'rows' => ['required', 'array', 'min:1'],
            'rows.*.id' => ['required', 'integer'],
            'rows.*.resolution' => ['required', Rule::in(['accept', 'skip'])],
            'rows.*.class_id' => ['nullable', 'integer', Rule::exists('classes', 'id')],
            'rows.*.new_class_name' => ['nullable', 'string', 'max:255'],
            'rows.*.new_class_section' => ['nullable', 'string', 'max:50'],
            'rows.*.first_name' => ['nullable', 'string', 'max:255'],
            'rows.*.last_name' => ['nullable', 'string', 'max:255'],
        ];
    }
}
