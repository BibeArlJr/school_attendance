<?php

namespace App\Modules\Settings\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Attendance\Models\SchoolCalendar;
use App\Modules\Settings\Http\Requests\StoreSchoolCalendarRangeRequest;
use App\Modules\Settings\Http\Requests\StoreSchoolCalendarRequest;
use App\Modules\Settings\Http\Requests\UpdateSchoolCalendarRequest;
use App\Support\Responses\ApiResponse;
use App\Support\Services\CurrentSchoolResolver;
use Carbon\CarbonPeriod;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Real hard deletes here (unlike Students/Parents/etc's soft-delete or
 * delete-blocked conventions) — a calendar entry isn't a record of a real
 * person, and nothing else references school_calendars by foreign key,
 * so there's no history to preserve or dependent-record check to run.
 */
class SettingsCalendarController extends Controller
{
    public function __construct(private readonly CurrentSchoolResolver $schoolResolver)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $schoolId = $this->schoolResolver->resolve($request->user());

        $entries = SchoolCalendar::query()
            ->where('school_id', $schoolId)
            ->orderBy('date')
            ->get();

        return ApiResponse::success($entries);
    }

    public function store(StoreSchoolCalendarRequest $request): JsonResponse
    {
        $schoolId = $this->schoolResolver->resolve($request->user());

        $entry = SchoolCalendar::query()->create([
            ...$request->validated(),
            'school_id' => $schoolId,
        ]);

        return ApiResponse::success($entry, 'Calendar entry added successfully.', 201);
    }

    /**
     * One school_calendars row per date in the range (Prompt 27 Part A)
     * — storage and every existing reader (AttendanceAnalyticsService's
     * whereBetween/keyBy-by-date queries) stay completely untouched,
     * this is purely a bulk-create convenience on top of the same
     * one-row-per-date shape. updateOrCreate per date so a range that
     * overlaps an already-entered date overwrites it instead of failing
     * the whole batch (see StoreSchoolCalendarRangeRequest's docblock).
     */
    public function storeRange(StoreSchoolCalendarRangeRequest $request): JsonResponse
    {
        $schoolId = $this->schoolResolver->resolve($request->user());
        $validated = $request->validated();

        $entries = DB::transaction(function () use ($schoolId, $validated) {
            $created = [];
            $period = CarbonPeriod::create($validated['start_date'], $validated['end_date']);

            foreach ($period as $date) {
                $created[] = SchoolCalendar::query()->updateOrCreate(
                    ['school_id' => $schoolId, 'date' => $date->toDateString()],
                    [
                        'day_type' => $validated['day_type'],
                        'label' => $validated['label'] ?? null,
                        'half_day_end_time' => $validated['half_day_end_time'] ?? null,
                    ],
                );
            }

            return $created;
        });

        $count = count($entries);

        return ApiResponse::success(
            $entries,
            $count.' calendar '.($count === 1 ? 'entry' : 'entries').' added successfully.',
            201,
        );
    }

    public function update(UpdateSchoolCalendarRequest $request, SchoolCalendar $schoolCalendar): JsonResponse
    {
        $schoolCalendar->update($request->validated());

        return ApiResponse::success($schoolCalendar->fresh(), 'Calendar entry updated successfully.');
    }

    public function destroy(SchoolCalendar $schoolCalendar): JsonResponse
    {
        $schoolCalendar->delete();

        return ApiResponse::success(null, 'Calendar entry deleted successfully.');
    }
}
