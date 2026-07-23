<?php

namespace App\Modules\Student\Models;

use App\Modules\Import\Models\ImportBatch;
use App\Modules\ParentGuardian\Models\StudentParentLink;
use App\Modules\School\Models\School;
use App\Modules\School\Models\SchoolClass;
use App\Support\Enums\StudentStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Student extends Model
{
    protected $fillable = [
        'school_id',
        'class_id',
        'admission_no',
        'first_name',
        'last_name',
        'dob',
        'gender',
        'status',
        'admission_date',
        'address',
        'dob_bs',
        'import_batch_id',
    ];

    protected function casts(): array
    {
        return [
            'dob' => 'date',
            'admission_date' => 'date',
            'status' => StudentStatus::class,
        ];
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(StudentEnrollment::class);
    }

    public function parentLinks(): HasMany
    {
        return $this->hasMany(StudentParentLink::class);
    }

    public function importBatch(): BelongsTo
    {
        return $this->belongsTo(ImportBatch::class);
    }
}
