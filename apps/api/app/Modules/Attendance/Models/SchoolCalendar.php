<?php

namespace App\Modules\Attendance\Models;

use App\Modules\School\Models\School;
use App\Support\Concerns\BelongsToSchool;
use App\Support\Enums\CalendarDayType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SchoolCalendar extends Model
{
    use BelongsToSchool;

    protected $fillable = [
        'school_id',
        'date',
        'day_type',
        'label',
        'half_day_end_time',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'day_type' => CalendarDayType::class,
        ];
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }
}
