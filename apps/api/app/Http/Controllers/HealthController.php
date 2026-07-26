<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * GET /api/health (Prompt 45) — no auth, deliberately: this is what an
 * external uptime monitor (UptimeRobot or whatever's chosen at
 * deployment time) polls, not an authenticated app feature. Distinct
 * from Laravel's built-in GET /up, which only confirms the app booted
 * and rendered an HTML response — it never touches the database, so it
 * would report "up" even with the DB fully unreachable.
 */
class HealthController extends Controller
{
    public function index(): JsonResponse
    {
        $checks = ['database' => $this->checkDatabase()];
        $healthy = ! in_array(false, array_column($checks, 'ok'), true);

        return response()->json([
            'status' => $healthy ? 'ok' : 'error',
            'checks' => array_map(fn (array $check) => $check['detail'], $checks),
        ], $healthy ? 200 : 503);
    }

    /**
     * @return array{ok: bool, detail: string}
     */
    private function checkDatabase(): array
    {
        try {
            DB::select('select 1');

            return ['ok' => true, 'detail' => 'ok'];
        } catch (Throwable $e) {
            return ['ok' => false, 'detail' => "unreachable: {$e->getMessage()}"];
        }
    }
}
