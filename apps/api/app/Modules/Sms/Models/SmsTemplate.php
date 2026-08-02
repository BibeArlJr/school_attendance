<?php

namespace App\Modules\Sms\Models;

use App\Modules\School\Models\School;
use App\Support\Enums\SmsTemplateType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A per-school-overridable SMS message template (Prompt 50). school_id
 * null = the platform-wide default every school falls back to when it
 * has no override of its own — same shape as SmsProviderConfig
 * (Prompt 43). Deliberately NOT the BelongsToSchool trait, for the same
 * reason that model documents: template resolution needs to see both a
 * specific school's row and the null-school_id fallback row in one
 * query, which BelongsToSchool's automatic single-school filter would
 * prevent.
 */
class SmsTemplate extends Model
{
    protected $fillable = [
        'school_id',
        'type',
        'template_text',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'type' => SmsTemplateType::class,
            'is_active' => 'boolean',
        ];
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }
}
