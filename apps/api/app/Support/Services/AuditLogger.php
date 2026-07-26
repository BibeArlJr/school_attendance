<?php

namespace App\Support\Services;

use App\Support\Models\AuditLog;
use Illuminate\Support\Facades\Auth;

/**
 * The one place an audit_logs row is ever written (Prompt 43) — every
 * call site gets the same shape (actor always resolved from the
 * authenticated request, never passed in and never spoofable by a
 * caller), rather than each module hand-rolling its own ad hoc logging
 * with an inconsistent shape.
 *
 * Scope is deliberately narrow — accountability-relevant actions only
 * (deletes, license/subscription changes, school activation, employment
 * status changes, password resets, settings changes, school creation),
 * not every read or minor edit. See each call site's own comment for why
 * that specific action is audited.
 */
class AuditLogger
{
    /**
     * @param  array<string, mixed>|null  $before
     * @param  array<string, mixed>|null  $after
     */
    public function log(
        string $action,
        string $entityType,
        ?int $entityId,
        ?array $before = null,
        ?array $after = null,
        ?int $schoolId = null,
    ): void {
        AuditLog::create([
            'school_id' => $schoolId,
            'actor_user_id' => Auth::id(),
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'before_json' => $before,
            'after_json' => $after,
        ]);
    }
}
