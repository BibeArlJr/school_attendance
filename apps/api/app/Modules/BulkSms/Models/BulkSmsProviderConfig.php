<?php

namespace App\Modules\BulkSms\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * The Bulk SMS module's own Sparrow credential — completely separate
 * from App\Modules\Sms\Models\SmsProviderConfig (the attendance/school
 * system's credential table). No shared rows, no FK, never read from
 * or written to by anything outside app/Modules/BulkSms.
 */
class BulkSmsProviderConfig extends Model
{
    protected $fillable = [
        'token',
        'sender_id',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'token' => 'encrypted',
            'is_active' => 'boolean',
        ];
    }
}
