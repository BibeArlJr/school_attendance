<?php

namespace App\Modules\School\Models;

use App\Models\User;
use App\Support\Concerns\HasUuidRouteKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// `Class` is a reserved word, hence SchoolClass — the table itself is
// plain `classes`.
class SchoolClass extends Model
{
    use HasUuidRouteKey;

    protected $table = 'classes';

    protected $fillable = [
        'school_id',
        'academic_year_id',
        'name',
        'section',
        'class_teacher_id',
        'grade_level',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function classTeacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'class_teacher_id');
    }
}
