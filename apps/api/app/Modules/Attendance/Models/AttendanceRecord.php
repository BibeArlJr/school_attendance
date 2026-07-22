<?php

namespace App\Modules\Attendance\Models;

use App\Models\User;
use App\Modules\School\Models\School;
use App\Support\Enums\AttendanceRecordStatus;
use App\Support\Enums\AttendanceSource;
use App\Support\Enums\RecordDayType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class AttendanceRecord extends Model
{
    protected $fillable = [
        'school_id',
        'owner_type',
        'owner_id',
        'date',
        'in_time',
        'out_time',
        'status',
        'day_type',
        'late',
        'early_departure',
        'source',
        'modified_by',
        'override_reason',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'status' => AttendanceRecordStatus::class,
            'day_type' => RecordDayType::class,
            'late' => 'boolean',
            'early_departure' => 'boolean',
            'source' => AttendanceSource::class,
        ];
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function owner(): MorphTo
    {
        return $this->morphTo();
    }

    public function modifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'modified_by');
    }
}
