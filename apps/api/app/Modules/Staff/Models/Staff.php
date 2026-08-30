<?php

namespace App\Modules\Staff\Models;

use App\Modules\Import\Models\ImportBatch;
use App\Modules\School\Models\School;
use App\Support\Concerns\BelongsToSchool;
use App\Support\Concerns\HasUuidRouteKey;
use App\Support\Enums\StaffEmploymentStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Genuine HR/personnel record (a real employee — teacher, etc.),
 * deliberately independent of `users`: no user_id, no login capability
 * implied. Distinct from UserAccount (App\Modules\Users), which is the
 * unrelated "login account" concept the old `staff` table/model used to
 * be named before this rename freed up the name for this real domain
 * concept. Employment status changes are soft — no hard delete path
 * exists for a staff member with real attendance history, matching
 * every other personal record in this system (Student, ParentGuardian).
 */
class Staff extends Model
{
    use HasUuidRouteKey;
    use BelongsToSchool;

    protected $table = 'staff';

    protected $fillable = [
        'school_id',
        'name',
        'mobile',
        'dob_bs',
        'address',
        'citizenship_number',
        'designation',
        'rank',
        'sheet_roll_no',
        'level',
        'employment_status',
        'import_batch_id',
    ];

    protected function casts(): array
    {
        return [
            'employment_status' => StaffEmploymentStatus::class,
        ];
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function importBatch(): BelongsTo
    {
        return $this->belongsTo(ImportBatch::class);
    }
}
