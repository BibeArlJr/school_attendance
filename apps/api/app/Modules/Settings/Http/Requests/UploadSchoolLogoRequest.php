<?php

namespace App\Modules\Settings\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UploadSchoolLogoRequest extends FormRequest
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
            'logo' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ];
    }
}
