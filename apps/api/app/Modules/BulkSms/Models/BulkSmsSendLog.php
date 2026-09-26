<?php

namespace App\Modules\BulkSms\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One row per test-send attempt (Stage 2). Deliberately independent of
 * App\Modules\Sms\Models\SmsLog — no FK, no shared table, no school_id.
 */
class BulkSmsSendLog extends Model
{
    protected $fillable = [
        'recipient',
        'message',
        'segment_count',
        'status',
        'provider_response_code',
        'provider_response_message',
        'attempted_at',
        'sent_at',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'attempted_at' => 'datetime',
            'sent_at' => 'datetime',
        ];
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
