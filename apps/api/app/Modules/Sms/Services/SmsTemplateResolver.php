<?php

namespace App\Modules\Sms\Services;

use App\Modules\Sms\Models\SmsTemplate;
use App\Support\Enums\SmsTemplateType;

/**
 * Resolves and renders the SMS template a given school actually uses for
 * a given event type (Prompt 50) — the school's own override if one
 * exists and is active, the platform default (school_id null)
 * otherwise. Same school-specific-first, platform-default-fallback
 * pattern as RealSparrowSmsService::resolveCredentials() (Prompt 43).
 */
class SmsTemplateResolver
{
    public function resolve(int $schoolId, SmsTemplateType $type): ?SmsTemplate
    {
        $query = SmsTemplate::query()->where('type', $type->value)->where('is_active', true);

        $template = (clone $query)->where('school_id', $schoolId)->first();
        $template ??= (clone $query)->whereNull('school_id')->first();

        return $template;
    }

    /**
     * @param  array<string, string>  $placeholders  e.g. ['student_name' => 'Ram Sharma', 'school_name' => 'Demo School', 'time' => '2:42 PM']
     */
    public function render(int $schoolId, SmsTemplateType $type, array $placeholders): ?string
    {
        $template = $this->resolve($schoolId, $type);

        if (! $template) {
            return null;
        }

        return self::interpolate($template->template_text, $placeholders);
    }

    /**
     * @param  array<string, string>  $placeholders
     */
    public static function interpolate(string $templateText, array $placeholders): string
    {
        $search = [];
        $replace = [];

        foreach ($placeholders as $key => $value) {
            $search[] = "{{$key}}";
            $replace[] = $value;
        }

        return str_replace($search, $replace, $templateText);
    }
}
