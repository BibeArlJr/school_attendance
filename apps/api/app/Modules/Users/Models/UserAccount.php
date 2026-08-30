<?php

namespace App\Modules\Users\Models;

use App\Models\User;
use App\Modules\School\Models\School;
use App\Support\Concerns\BelongsToSchool;
use App\Support\Concerns\HasUuidRouteKey;
use App\Support\Enums\StaffEmploymentStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Renamed from Staff (table `staff` -> `user_accounts`) — this model
 * backs the "Users" page (admin/guard LOGIN accounts), not the new
 * HR-domain `staff` table (App\Modules\Staff\Models\Staff, no user_id,
 * no login capability). The two were sharing the name "Staff" before
 * this rename, which is exactly the collision this rename exists to
 * resolve. Every user_id-linked, login-account-adjacent concern
 * (designation/employment_status tracking for an admin or guard) lives
 * here; genuine personnel/HR records live in the new Staff model.
 * StaffEmploymentStatus is deliberately still reused as-is by both
 * models (same 3 values — active/on_leave/resigned — apply equally to
 * either concept), not duplicated into a second enum.
 */
class UserAccount extends Model
{
    use HasUuidRouteKey;
    use BelongsToSchool;

    protected $table = 'user_accounts';

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
