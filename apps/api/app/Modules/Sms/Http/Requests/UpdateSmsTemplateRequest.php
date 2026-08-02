<?php

namespace App\Modules\Sms\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * A school's own override (Prompt 50) — nullable/blank deliberately
 * means "remove the override, fall back to the platform default", not
 * "save an empty message". See SmsTemplateController::update().
 */
class UpdateSmsTemplateRequest extends FormRequest
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
            'template_text' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
