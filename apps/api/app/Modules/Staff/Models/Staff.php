<?php

namespace App\Modules\Staff\Models;

use App\Models\User;
use App\Modules\School\Models\School;
use App\Support\Concerns\HasUuidRouteKey;
use App\Support\Enums\StaffEmploymentStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Staff extends Model
{
    use HasUuidRouteKey;

    protected $table = 'staff';

    protected $fillable = [
        'school_id',
        'user_id',
        'designation',
        'employment_status',
    ];

    protected function casts(): array
    {
        return [
            'employment_status' => StaffEmploymentStatus::class,
        ];
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
