<?php

namespace App\Modules\Sms\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Sms\Http\Requests\UpdatePlatformSmsTemplateRequest;
use App\Modules\Sms\Http\Requests\UpdateSmsTemplateRequest;
use App\Modules\Sms\Models\SmsTemplate;
use App\Support\Enums\SmsTemplateType;
use App\Support\Responses\ApiResponse;
use App\Support\Services\AuditLogger;
use App\Support\Services\CurrentSchoolResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * SMS message template management (Prompt 50) — lives in the Sms module
 * (not Settings, which only aggregates routes/controllers for other
 * modules' domain models the same way SettingsCalendarController does
 * for Attendance's SchoolCalendar), exposed under /settings/sms-templates
 * to match where the frontend surfaces it.
 */
class SmsTemplateController extends Controller
{
    public function __construct(
        private readonly CurrentSchoolResolver $schoolResolver,
        private readonly AuditLogger $auditLogger,
    ) {
    }

    /**
     * Both types, always including the platform-default text (needed so
     * the frontend can show what "no override" currently resolves to,
     * and so super_admin has something to edit) alongside this school's
     * own override, if any.
     */
    public function index(Request $request): JsonResponse
    {
        $schoolId = $this->schoolResolver->resolve($request->user());

        return ApiResponse::success([
            'school_id' => $schoolId,
            'templates' => collect(SmsTemplateType::cases())->mapWithKeys(
                fn (SmsTemplateType $type) => [$type->value => $this->describeType($schoolId, $type)],
            ),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function describeType(int $schoolId, SmsTemplateType $type): array
    {
        $schoolOverride = SmsTemplate::query()
            ->where('school_id', $schoolId)
            ->where('type', $type->value)
            ->first();

        $platformDefault = SmsTemplate::query()
            ->whereNull('school_id')
            ->where('type', $type->value)
            ->first();

        return [
            'school_override_text' => $schoolOverride?->template_text,
            'platform_default_text' => $platformDefault?->template_text,
            'effective_text' => $schoolOverride?->template_text ?? $platformDefault?->template_text,
            'is_overridden' => $schoolOverride !== null,
        ];
    }

    /**
     * A school's own override. Blank/omitted template_text removes it
     * (falls back to the platform default) rather than saving an empty
     * message — see UpdateSmsTemplateRequest's docblock.
     */
    public function update(UpdateSmsTemplateRequest $request, SmsTemplateType $type): JsonResponse
    {
        $schoolId = $this->schoolResolver->resolve($request->user());
        $text = $request->validated('template_text');

        $existing = SmsTemplate::query()->where('school_id', $schoolId)->where('type', $type->value)->first();
        $before = $existing?->template_text;

        if ($text === null || trim($text) === '') {
            $existing?->delete();
            $this->auditLogger->log(
                'settings.sms_template_reset',
                'sms_template',
                $schoolId,
                ['template_text' => $before],
                null,
                $schoolId,
            );

            return ApiResponse::success(
                $this->describeType($schoolId, $type),
                'Reverted to the platform default template.',
            );
        }

        SmsTemplate::query()->updateOrCreate(
            ['school_id' => $schoolId, 'type' => $type->value],
            ['template_text' => $text, 'is_active' => true],
        );

        $this->auditLogger->log(
            'settings.sms_template_updated',
            'sms_template',
            $schoolId,
            ['template_text' => $before],
            ['template_text' => $text],
            $schoolId,
        );

        return ApiResponse::success($this->describeType($schoolId, $type), 'Template updated successfully.');
    }

    /**
     * The platform-default row — super_admin only (enforced by the
     * can:platform-admin route middleware, not re-checked here). Never
     * deletable through this endpoint: UpdatePlatformSmsTemplateRequest
     * requires non-empty text, since this is the fallback every school
     * without its own override depends on.
     */
    public function updatePlatformDefault(UpdatePlatformSmsTemplateRequest $request, SmsTemplateType $type): JsonResponse
    {
        $template = SmsTemplate::query()->whereNull('school_id')->where('type', $type->value)->firstOrFail();
        $before = $template->template_text;
        $text = $request->validated('template_text');

        $template->update(['template_text' => $text]);

        $this->auditLogger->log(
            'settings.sms_platform_template_updated',
            'sms_template',
            $template->id,
            ['template_text' => $before],
            ['template_text' => $text],
            null,
        );

        return ApiResponse::success(
            ['type' => $type->value, 'platform_default_text' => $template->fresh()->template_text],
            'Platform default template updated successfully.',
        );
    }
}
