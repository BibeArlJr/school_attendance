<?php

namespace App\Modules\Staff\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CommitStaffImportRequest extends FormRequest
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
            // Reviewer-editable override, same "fix it in the review step"
            // pattern as students' first_name/last_name overrides — no
            // class_id/new_class_name equivalent needed, staff has no
            // class concept at all.
            'rows.*.name' => ['nullable', 'string', 'max:255'],
        ];
    }
}
