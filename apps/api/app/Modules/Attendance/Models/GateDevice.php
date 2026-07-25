<?php

namespace App\Modules\Attendance\Models;

use App\Modules\School\Models\School;
use App\Support\Concerns\BelongsToSchool;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GateDevice extends Model
{
    use BelongsToSchool;

    protected $fillable = [
        'school_id',
        'name',
        'location_note',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }
}
