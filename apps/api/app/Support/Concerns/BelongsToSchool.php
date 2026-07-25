<?php

namespace App\Support\Concerns;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

/**
 * Global tenant-isolation scope (Prompt 40) — automatically adds a
 * school_id filter to every query against a tenant-scoped model, so a
 * future controller can't forget it the way show()/update()/destroy()
 * across half this codebase already had (route-model-binding by UUID
 * alone is not the same as authorization: a leaked UUID plus any valid
 * token from ANY school was enough to view/edit/delete it).
 *
 * Deliberately NOT applied to User: Sanctum's own guard resolves
 * $request->user() by querying User directly, before Auth::user() has
 * anything to return — scoping User here would make that resolution
 * depend on the very thing it's trying to produce. There's no route ever
 * binds {user} directly (staff-facing actions go through Staff, which
 * does carry this trait), so there's no exploitable gap left by the
 * exclusion.
 *
 * super_admin has no school_id of their own (Prompt 24) — scopes to
 * whichever school they've explicitly selected via active_school_id
 * (POST /platform/active-school), never to "every school" by default.
 * Platform Console's own deliberate cross-tenant aggregate queries
 * (PlatformSchoolController) opt out of this scope explicitly via
 * withoutGlobalScope(BelongsToSchool::class) — that's the one
 * intentional, visible exception, not a silent permissive branch here.
 */
trait BelongsToSchool
{
    protected static function bootBelongsToSchool(): void
    {
        // Named by the trait's own class, not self::/static:: (which
        // would resolve to whichever model uses the trait) — the fixed
        // name is what lets withoutGlobalScope(BelongsToSchool::class)
        // actually find and remove it from any of these models.
        static::addGlobalScope(BelongsToSchool::class, function (Builder $builder) {
            $user = Auth::user();

            // No authenticated request context (artisan/queue/tinker) —
            // nothing to scope against, and no HTTP tenant boundary to
            // leak across.
            if (! $user) {
                return;
            }

            $column = $builder->getModel()->qualifyColumn('school_id');

            if ($user->school_id !== null) {
                $builder->where($column, $user->school_id);

                return;
            }

            if ($user->active_school_id !== null) {
                $builder->where($column, $user->active_school_id);

                return;
            }

            // super_admin with no active school selected yet: fail
            // closed (matches CurrentSchoolResolver's own
            // NoActiveSchoolSelectedException intent elsewhere) rather
            // than silently returning every school's rows.
            $builder->whereRaw('1 = 0');
        });
    }
}
