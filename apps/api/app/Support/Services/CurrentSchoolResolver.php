<?php

namespace App\Support\Services;

use App\Models\User;
use App\Modules\School\Models\School;

/**
 * Resolves which school a request operates against. Phase 12
 * (multi-tenant hardening) hasn't happened yet and only one demo school
 * exists, so this is a deliberate simplification, not the final design.
 */
class CurrentSchoolResolver
{
    public function resolve(User $user): int
    {
        if ($user->school_id !== null) {
            return $user->school_id;
        }

        // TODO(Phase 12): support super_admin operating across multiple
        // schools via explicit school selection.
        return School::query()->firstOrFail()->id;
    }
}
