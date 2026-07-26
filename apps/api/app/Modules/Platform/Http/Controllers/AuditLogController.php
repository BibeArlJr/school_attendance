<?php

namespace App\Modules\Platform\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Support\Models\AuditLog;
use App\Support\Responses\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * super_admin-only viewer for AuditLog rows (Prompt 43) — the whole
 * point of the log is useless if nobody can actually look at it.
 * Deliberately unfiltered by school by default (unlike every other list
 * endpoint in this app): a platform operator reviewing accountability
 * needs cross-school visibility, narrowed explicitly via the school_id
 * filter, not auto-restricted to whichever school they happen to have
 * selected as active.
 */
class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = AuditLog::query()->with(['actor:id,name,email', 'school:id,name'])->orderByDesc('created_at');

        if ($search = trim((string) $request->query('search', ''))) {
            $query->where(function ($inner) use ($search) {
                $inner->where('action', 'ilike', "%{$search}%")
                    ->orWhere('entity_type', 'ilike', "%{$search}%");
            });
        }

        if ($schoolId = $request->query('school_id')) {
            $query->where('school_id', (int) $schoolId);
        }

        if ($actorUserId = $request->query('actor_user_id')) {
            $query->where('actor_user_id', (int) $actorUserId);
        }

        if ($action = $request->query('action')) {
            $query->where('action', $action);
        }

        if ($from = $request->query('date_from')) {
            $query->where('created_at', '>=', Carbon::parse($from)->startOfDay());
        }

        if ($to = $request->query('date_to')) {
            $query->where('created_at', '<=', Carbon::parse($to)->endOfDay());
        }

        $logs = $query->paginate((int) $request->query('per_page', 25))->withQueryString();

        return ApiResponse::success($logs);
    }

    /**
     * Distinct action values actually present — backs the filter
     * dropdown with only options that will ever return a result, rather
     * than a hardcoded list that drifts from whatever's really logged.
     */
    public function actions(): JsonResponse
    {
        $actions = AuditLog::query()->distinct()->orderBy('action')->pluck('action');

        return ApiResponse::success($actions);
    }

    /**
     * Same "only options that actually appear" principle as actions()
     * above, applied to the actor filter — every user who has ever
     * triggered an audited action, not every user in the system.
     */
    public function actors(): JsonResponse
    {
        $actors = AuditLog::query()
            ->join('users', 'users.id', '=', 'audit_logs.actor_user_id')
            ->distinct()
            ->orderBy('users.name')
            ->get(['users.id', 'users.name', 'users.email']);

        return ApiResponse::success($actors);
    }
}
