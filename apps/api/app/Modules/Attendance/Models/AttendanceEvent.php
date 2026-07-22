<?php

namespace App\Modules\Attendance\Models;

use App\Models\User;
use App\Modules\School\Models\School;
use App\Support\Enums\AttendanceEventResult;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

// Append-only: nothing in this codebase ever updates a row here except
// AttendanceService::markReviewed() (reviewed_by/reviewed_at/review_note
// only) — see app/Modules/Attendance/routes.php, which has no
// update/delete route for the underlying scan data at all.
class AttendanceEvent extends Model
{
    protected $fillable = [
        'school_id',
        'barcode_value',
        'resolved_owner_type',
        'resolved_owner_id',
        'gate_device_id',
        'guard_user_id',
        'scanned_at',
        'result',
        'needs_review',
        'reviewed_by',
        'reviewed_at',
        'review_note',
    ];

    protected function casts(): array
    {
        return [
            'scanned_at' => 'datetime',
            'result' => AttendanceEventResult::class,
            'needs_review' => 'boolean',
            'reviewed_at' => 'datetime',
        ];
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function resolvedOwner(): MorphTo
    {
        return $this->morphTo(null, 'resolved_owner_type', 'resolved_owner_id');
    }

    public function gateDevice(): BelongsTo
    {
        return $this->belongsTo(GateDevice::class);
    }

    // Named guardUser(), not guard() — Eloquent's Model already declares
    // guard(array $guarded) for mass-assignment guarding.
    public function guardUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'guard_user_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
