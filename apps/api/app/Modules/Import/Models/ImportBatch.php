<?php

namespace App\Modules\Import\Models;

use App\Models\User;
use App\Modules\School\Models\School;
use App\Support\Concerns\BelongsToSchool;
use App\Support\Enums\ImportBatchStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ImportBatch extends Model
{
    use BelongsToSchool;

    protected $fillable = [
        'school_id',
        'file_name',
        // 'student' or 'staff' — which entity this batch's rows resolve
        // to (Part H of the rebuild-staff prompt). Default 'student' at
        // the DB level covers every batch created before this column
        // existed.
        'entity_type',
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
