<?php

namespace App\Modules\Settings\Http\Requests;

use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * Deliberately no per-date uniqueness rule here (unlike
 * StoreSchoolCalendarRequest) — SettingsCalendarController::storeRange()
 * uses updateOrCreate per date, so a range overlapping an
 * already-entered date is expected to just overwrite it rather than
 * fail the whole range. That matches how an admin actually thinks about
 * "mark these dates as the Dashain holiday," even if a couple of days
 * in the middle were already entered individually.
 */
class StoreSchoolCalendarRangeRequest extends FormRequest
{
    /** Generous cap on a single festival block (Dashain/Tihar are ~15-20
     *  days at most) — guards against an accidental year-long range. */
    private const MAX_RANGE_DAYS = 60;

    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'day_type' => ['required', 'in:working,holiday,half_day,exam_day'],
            'label' => ['nullable', 'string', 'max:255'],
            'half_day_end_time' => ['required_if:day_type,half_day', 'nullable', 'date_format:H:i:s,H:i'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $start = $this->input('start_date');
            $end = $this->input('end_date');
            if (! $start || ! $end) {
                return;
            }

            $days = Carbon::parse($start)->diffInDays(Carbon::parse($end)) + 1;
            if ($days > self::MAX_RANGE_DAYS) {
                $validator->errors()->add(
                    'end_date',
                    'Range is too large — split it into smaller chunks (max '.self::MAX_RANGE_DAYS.' days).',
                );
            }
        });
    }
}
