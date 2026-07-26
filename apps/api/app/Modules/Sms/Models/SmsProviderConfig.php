<?php

namespace App\Modules\Sms\Models;

use App\Modules\School\Models\School;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * SMS gateway credentials (Prompt 43), encrypted at rest. school_id null
 * = the platform-wide default every school currently shares; a non-null
 * row is a school-specific override, resolved first when one exists (see
 * RealSparrowSmsService::resolveCredentials()). Deliberately NOT using
 * the BelongsToSchool trait — that resolution needs to see both a
 * specific school's row and the null-school_id fallback in the same
 * query, which BelongsToSchool's single-school auto-filter would break.
 */
class SmsProviderConfig extends Model
{
    protected $fillable = [
        'school_id',
        'provider_name',
        'credentials',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            // Laravel encrypts the serialized array before it's ever
            // written to the credentials column, and decrypts it on
            // read — the DB only ever sees ciphertext.
            'credentials' => 'encrypted:array',
            'is_active' => 'boolean',
        ];
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }
}
