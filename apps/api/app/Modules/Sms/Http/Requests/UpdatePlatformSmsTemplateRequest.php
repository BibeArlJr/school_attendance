<?php

namespace App\Modules\Sms\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * The platform-default row (Prompt 50, super_admin-only — see
 * SmsTemplateController::updatePlatformDefault()) — required, not
 * nullable, unlike a school's own override: this is the fallback every
 * school without an override relies on, so it can be edited but never
 * blanked out to nothing.
 */
class UpdatePlatformSmsTemplateRequest extends FormRequest
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
            'template_text' => ['required', 'string', 'max:1000'],
        ];
    }
}
