<?php

namespace App\Modules\Import\Models;

use App\Models\User;
use App\Modules\School\Models\School;
use App\Support\Enums\ImportBatchStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ImportBatch extends Model
{
    protected $fillable = [
        'school_id',
        'file_name',
        'uploaded_by',
        'uploaded_at',
        'total_rows',
        'imported_count',
        'skipped_count',
        'skipped_sheets',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'uploaded_at' => 'datetime',
            'skipped_sheets' => 'array',
            'status' => ImportBatchStatus::class,
        ];
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function rows(): HasMany
    {
        return $this->hasMany(ImportBatchRow::class);
    }
}
