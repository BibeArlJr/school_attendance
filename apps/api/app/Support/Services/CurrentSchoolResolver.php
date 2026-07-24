<?php

namespace App\Support\Services;

use App\Models\User;
use App\Modules\School\Models\School;
use App\Support\Exceptions\NoActiveSchoolSelectedException;

/**
 * Resolves which school a request operates against. Regular users
 * (admin/teacher/guard) always resolve to their own school_id — that
 * path is untouched by Prompt 24. super_admin has no school_id of their
 * own (platform-level), so they must explicitly select one first
 * (POST /platform/active-school) — no silent "the only school" fallback
 * anymore (that was a deliberate Phase 1-era simplification, now that a
 * second real school exists to make it actively wrong).
 */
class CurrentSchoolResolver
{
    public function resolve(User $user): int
    {
        if ($user->school_id !== null) {
            return $user->school_id;
        }

        if ($user->active_school_id !== null
            && School::query()->whereKey($user->active_school_id)->exists()) {
            return $user->active_school_id;
        }

        throw new NoActiveSchoolSelectedException();
    }
}
