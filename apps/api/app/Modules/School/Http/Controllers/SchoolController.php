<?php

namespace App\Modules\School\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\School\Models\School;
use App\Support\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class SchoolController extends Controller
{
    /**
     * School itself has no school_id column, so it's never covered by
     * BelongsToSchool — this route (plain auth:sanctum, no can: gate)
     * was the one place a school's own profile could be read by any
     * authenticated user from ANY school, just by guessing the next
     * small sequential id (Prompt 40). super_admin can still look up any
     * school here, matching their existing Platform Console access;
     * everyone else only their own — a mismatch 404s, exactly like every
     * other tenant-scoped record now does, rather than confirming
     * another school's id exists via a distinguishable 403.
     */
    public function show(Request $request, School $school): JsonResponse
    {
        $user = $request->user();

        if ($user->role->value !== 'super_admin' && $user->school_id !== $school->id) {
            throw (new ModelNotFoundException())->setModel(School::class, [$school->id]);
        }

        return ApiResponse::success($school);
    }
}
