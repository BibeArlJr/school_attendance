<?php

namespace App\Modules\ParentGuardian\Models;

use App\Models\User;
use App\Modules\School\Models\School;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

// No SoftDeletes: parent_guardians has no destroy route at all in this
// phase (real people, no-hard-delete, but also simply never deleted —
// see StudentParentLink for the association rows that DO get deleted).
class ParentGuardian extends Model
{
    protected $fillable = [
        'school_id',
        'name',
        'phone',
        'email',
        'user_id',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function links(): HasMany
    {
        return $this->hasMany(StudentParentLink::class, 'parent_id');
    }
}
