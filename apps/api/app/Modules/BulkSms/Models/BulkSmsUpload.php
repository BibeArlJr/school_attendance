<?php

namespace App\Modules\BulkSms\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Flat historical summary of one confirmed contact import — see the
 * migration's own docblock for why this carries no "rows"/status
 * workflow the way import_batches does.
 */
class BulkSmsUpload extends Model
{
    protected $fillable = [
        'file_name',
        'uploaded_by',
        'uploaded_at',
        'total_rows',
        'imported_count',
        'skipped_count',
    ];

    protected function casts(): array
    {
        return [
            'uploaded_at' => 'datetime',
        ];
    }

    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function contacts(): HasMany
    {
        return $this->hasMany(BulkSmsContact::class, 'upload_id');
    }
}
