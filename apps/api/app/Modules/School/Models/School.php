<?php

namespace App\Modules\School\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class School extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'logo_url',
        'primary_color',
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
}
