<?php

namespace App\Modules\ParentGuardian\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStudentParentLinkRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Either parent_id (link an existing parent) or name+phone (create
     * then link a new one) must be present — never both, never neither.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'parent_id' => ['nullable', 'integer', Rule::exists('parent_guardians', 'id')],
            // 'nullable' is required alongside 'required_without' here: when
            // parent_id IS present, the frontend still sends name/phone as
            // empty strings (fields it simply doesn't render), and
            // ConvertEmptyStringsToNull turns those into null before
            // validation runs — without 'nullable', the 'string' rule then
            // rejects that null even though required_without correctly
            // doesn't require it.
            'name' => ['nullable', 'required_without:parent_id', 'string', 'max:255'],
            'phone' => ['nullable', 'required_without:parent_id', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'relation' => ['required', Rule::in(['father', 'mother', 'guardian', 'other'])],
            'is_primary_contact' => ['required', 'boolean'],
        ];
    }
}
