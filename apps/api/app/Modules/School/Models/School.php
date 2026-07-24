<?php

namespace App\Modules\School\Models;

use App\Models\User;
use App\Modules\Student\Models\Student;
use App\Support\Enums\LicenseStatus;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class School extends Model
{
    use HasFactory;

    /** Grace window before amc_expiry_date — Prompt 25 Part C. */
    public const GRACE_DAYS = 15;

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
        'license_status',
        'amc_expiry_date',
    ];

    protected function casts(): array
    {
        return [
            'name' => 'string',
            'slug' => 'string',
            'license_status' => LicenseStatus::class,
            'amc_expiry_date' => 'date',
        ];
    }

    /**
     * The real source of truth for enforcement/display — always computed
     * from amc_expiry_date, never read from the stored license_status
     * column (which only records the outcome of the last explicit
     * activation and would otherwise silently drift stale as time
     * passes). A null amc_expiry_date (never activated, e.g. every
     * pre-Prompt-25 school) is treated as Active — activating a
     * subscription is an opt-in action, not a retroactive restriction on
     * schools that predate the feature.
     */
    public function licenseStatus(): LicenseStatus
    {
        if ($this->amc_expiry_date === null) {
            return LicenseStatus::Active;
        }

        $daysRemaining = $this->daysUntilExpiry();

        if ($daysRemaining < 0) {
            return LicenseStatus::Expired;
        }

        if ($daysRemaining <= self::GRACE_DAYS) {
            return LicenseStatus::Grace;
        }

        return LicenseStatus::Active;
    }

    /**
     * Negative once past expiry. Null if never activated.
     */
    public function daysUntilExpiry(): ?int
    {
        if ($this->amc_expiry_date === null) {
            return null;
        }

        return (int) Carbon::today()->diffInDays($this->amc_expiry_date, false);
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
