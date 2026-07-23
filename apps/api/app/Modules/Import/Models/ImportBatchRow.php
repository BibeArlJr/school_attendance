<?php

namespace App\Modules\Import\Models;

use App\Support\Enums\ImportRowResolution;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ImportBatchRow extends Model
{
    protected $fillable = [
        'import_batch_id',
        'row_number',
        'sheet_name',
        'raw_data',
        'proposed_data',
        'flags',
        'resolution',
    ];

    protected function casts(): array
    {
        return [
            'raw_data' => 'array',
            'proposed_data' => 'array',
            'flags' => 'array',
            'resolution' => ImportRowResolution::class,
        ];
    }

    public function importBatch(): BelongsTo
    {
        return $this->belongsTo(ImportBatch::class);
    }
}
