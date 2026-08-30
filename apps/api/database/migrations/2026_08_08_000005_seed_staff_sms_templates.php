<?php

use App\Modules\Sms\Models\SmsTemplate;
use App\Support\Enums\SmsTemplateType;
use Illuminate\Database\Migrations\Migration;

/**
 * Platform-default templates for the two new staff-facing types (Part F
 * of the rebuild-staff prompt) — same firstOrCreate seeding pattern as
 * the student templates' own migration. Distinct wording from the
 * student templates: no "प्रिय अभिभावक" (Dear Guardian) salutation or
 * "तपाईंको बच्चा" (your child) phrasing — this goes to the chairman as
 * an informational notice about an employee, not a personal message to
 * a parent about their own child.
 */
return new class () extends Migration {
    public function up(): void
    {
        SmsTemplate::query()->firstOrCreate(
            ['school_id' => null, 'type' => SmsTemplateType::StaffAttendanceIn->value],
            [
                'template_text' => 'कर्मचारी {staff_name} ले {school_name} मा {time} बजे प्रवेश गर्नुभयो।',
                'is_active' => true,
            ],
        );
        SmsTemplate::query()->firstOrCreate(
            ['school_id' => null, 'type' => SmsTemplateType::StaffAttendanceOut->value],
            [
                'template_text' => 'कर्मचारी {staff_name} {school_name} बाट {time} बजे प्रस्थान गर्नुभयो।',
                'is_active' => true,
            ],
        );
    }

    public function down(): void
    {
        SmsTemplate::query()
            ->whereNull('school_id')
            ->whereIn('type', [SmsTemplateType::StaffAttendanceIn->value, SmsTemplateType::StaffAttendanceOut->value])
            ->delete();
    }
};
