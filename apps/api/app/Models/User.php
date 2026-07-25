<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Modules\School\Models\School;
use App\Support\Enums\UserRole;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens;
    use HasFactory;
    use Notifiable;
    use SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * Previously unset entirely (leaving Eloquent's default
     * $guarded = ['*']) — harmless while nothing but DemoSeeder ever
     * called User::create()/updateOrCreate(), since Laravel's
     * SeedCommand wraps seeding in Model::unguarded() and bypasses this
     * check anyway. StaffService::create() (Prompt 8) is the first real
     * code path to mass-assign a User outside that context, which is
     * what actually surfaced this.
     *
     * @var array<int, string>
     */
    protected $fillable = ['name', 'email', 'phone', 'password', 'school_id', 'active_school_id', 'role', 'is_active', 'email_verified_at'];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = ['password', 'remember_token'];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => UserRole::class,
            'is_active' => 'boolean',
        ];
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    /**
     * Only meaningful for role=super_admin — which school's data they're
     * currently viewing (Prompt 24). Null until they explicitly select
     * one via POST /platform/active-school.
     */
    public function activeSchool(): BelongsTo
    {
        return $this->belongsTo(School::class, 'active_school_id');
    }
}
