<?php

namespace App\Modules\IdCard\Models;

use App\Modules\School\Models\School;
use App\Support\Concerns\BelongsToSchool;
use App\Support\Enums\IdCardStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class IdCard extends Model
{
    use BelongsToSchool;

    protected $fillable = [
        'school_id',
        'owner_type',
        'owner_id',
        'barcode_value',
        'status',
        'issued_date',
        'deactivated_date',
    ];

    protected function casts(): array
    {
        return [
            'issued_date' => 'date',
            'deactivated_date' => 'date',
            'status' => IdCardStatus::class,
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
}
