<?php

namespace App\Modules\ParentGuardian\Models;

use App\Modules\Student\Models\Student;
use App\Support\Enums\GuardianRelation;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// A real, first-class association record (its own id, its own lifecycle) —
// not a bare pivot table. Rows here are genuinely deleted on unlink,
// unlike ParentGuardian itself, which never is.
class StudentParentLink extends Model
{
    protected $fillable = [
        'student_id',
        'parent_id',
        'relation',
        'is_primary_contact',
    ];

    protected function casts(): array
    {
        return [
            'relation' => GuardianRelation::class,
            'is_primary_contact' => 'boolean',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function parentGuardian(): BelongsTo
    {
        return $this->belongsTo(ParentGuardian::class, 'parent_id');
    }
}
