<?php

namespace App\Modules\School\Models;

use App\Models\User;
use App\Modules\Student\Models\Student;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class School extends Model
{
    use HasFactory;

    // school_code is deliberately never fillable (Prompt 16/23) — it's
    // embedded in every barcode already issued, so it's immutable once
    // set. PlatformSchoolService sets it via direct property assignment
    // at creation, not mass-assignment, so there's no path (fillable or
    // otherwise) that lets it be changed later.
    protected $fillable = [
        'name',
        'slug',
        'logo_url',
        'primary_color',
        'contact_email',
        'contact_phone',
    ];

    protected function casts(): array
    {
        return [
            'name' => 'string',
            'slug' => 'string',
        ];
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function students(): HasMany
    {
        return $this->hasMany(Student::class);
    }
}
