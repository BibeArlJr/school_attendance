<?php

use App\Modules\Sms\Models\SmsTemplate;
use App\Support\Enums\SmsTemplateType;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::create('sms_templates', function (Blueprint $table) {
            $table->id();
            // Nullable = platform-wide default (Prompt 50), used when no
            // school-specific row exists for a given type — the exact
            // same resolution pattern sms_provider_configs already
            // established (Prompt 43). Deliberately NOT the
            // BelongsToSchool trait, for the same reason: the resolution
            // query needs to see both a specific school's row and the
            // null-school_id fallback in one lookup.
            $table->foreignId('school_id')->nullable()->constrained('schools')->cascadeOnDelete();
            $table->string('type');
            $table->text('template_text');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            // Postgres treats NULL as distinct per row in a unique index,
            // so this alone doesn't hard-block a second school_id=null
            // row per type at the database level — same known caveat as
            // sms_provider_configs' identical constraint; the one
            // platform-default-row-per-type invariant is maintained by
            // firstOrCreate() below and updateOrCreate() in the resolver/
            // controller, not by this index alone.
            $table->unique(['school_id', 'type']);
        });

        // Platform default templates (Prompt 50) — every school falls
        // back to these until it sets its own override. Nepali, not
        // English: this is the actual language the parents these
        // messages go to read, unlike Phase 7's original placeholder
        // English string.
        SmsTemplate::query()->firstOrCreate(
            ['school_id' => null, 'type' => SmsTemplateType::AttendanceIn->value],
            [
                'template_text' => 'प्रिय अभिभावक, तपाईंको बच्चा {student_name} ले {school_name} मा {time} बजे प्रवेश गर्नुभयो।',
                'is_active' => true,
            ],
        );
        SmsTemplate::query()->firstOrCreate(
            ['school_id' => null, 'type' => SmsTemplateType::AttendanceOut->value],
            [
                'template_text' => 'प्रिय अभिभावक, तपाईंको बच्चा {student_name} {school_name} बाट {time} बजे प्रस्थान गर्नुभयो।',
                'is_active' => true,
            ],
        );
    }

    public function down(): void
    {
        Schema::dropIfExists('sms_templates');
    }
};
