<?php

namespace App\Modules\Settings\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * school_code is deliberately never a rule here — it's embedded in every
 * already-issued barcode, so it's immutable via this endpoint regardless
 * of what a caller sends. The controller also only ever writes
 * $request->validated(), so an extra school_code key in the request body
 * is silently dropped, not just unvalidated.
 *
 * logo_url is deliberately not a rule here either (Prompt 26) — it's now
 * exclusively written by the dedicated multipart upload endpoint
 * (UploadSchoolLogoRequest / SettingsController::uploadLogo), so this
 * text-only endpoint no longer accepts it.
 */
class UpdateSchoolProfileRequest extends FormRequest
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
            'primary_color' => ['nullable', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'background_color' => ['nullable', 'regex:/^#[0-9A-Fa-f]{6}$/'],
        ];
    }
}
