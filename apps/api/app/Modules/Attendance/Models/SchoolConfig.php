<?php

namespace App\Modules\Attendance\Models;

use App\Modules\School\Models\School;
use App\Support\Concerns\BelongsToSchool;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SchoolConfig extends Model
{
    use BelongsToSchool;

    protected $primaryKey = 'school_id';

    public $incrementing = false;

    protected $fillable = [
        'school_id',
        'start_time',
        'end_time',
        'late_threshold_minutes',
        'early_departure_threshold_minutes',
        'duplicate_scan_window_seconds',
        'working_days',
    ];

    protected function casts(): array
    {
        return [
            'working_days' => 'array',
        ];
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }
}
