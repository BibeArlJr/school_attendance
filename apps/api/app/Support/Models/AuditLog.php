<?php

namespace App\Support\Models;

use App\Models\User;
use App\Modules\School\Models\School;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Append-only accountability trail (Prompt 43) — always written through
 * App\Support\Services\AuditLogger, never created ad hoc, so every row
 * has the same shape. Deliberately NOT using the BelongsToSchool trait:
 * the only reader is the super_admin-only audit log page, which needs
 * cross-school visibility by default (filtered explicitly by the viewer,
 * not auto-restricted to whichever school they happen to have selected).
 */
class AuditLog extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = [
        'school_id',
        'actor_user_id',
        'action',
        'entity_type',
        'entity_id',
        'before_json',
        'after_json',
    ];

    protected function casts(): array
    {
        return [
            'before_json' => 'array',
            'after_json' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_user_id');
    }
}
