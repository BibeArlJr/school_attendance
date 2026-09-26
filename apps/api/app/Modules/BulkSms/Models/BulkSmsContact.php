<?php

namespace App\Modules\BulkSms\Models;

use App\Models\User;
use App\Support\Concerns\HasUuidRouteKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Genuinely independent of Student/ParentGuardian/Staff/School — this
 * module never queries or joins against any of those (see the
 * migration's docblock). `phone` is always the normalized, canonical
 * 10-digit form (BulkSmsPhoneNormalizer) — never the as-typed original.
 * No BelongsToSchool: this is platform-level, not tenant-scoped.
 */
class BulkSmsContact extends Model
{
    use HasUuidRouteKey;

    protected $fillable = [
        'name',
        'phone',
        'upload_id',
        'created_by',
    ];

    public function upload(): BelongsTo
    {
        return $this->belongsTo(BulkSmsUpload::class, 'upload_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
