<?php

namespace App\Modules\Settings\Http\Requests;

use App\Support\Services\CurrentSchoolResolver;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSchoolCalendarRequest extends FormRequest
{
    public function __construct(private readonly CurrentSchoolResolver $schoolResolver)
    {
        parent::__construct();
    }

    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $schoolId = $this->schoolResolver->resolve($this->user());
        $currentId = $this->route('schoolCalendar')?->id;

        return [
            'date' => [
                'required',
                'date',
                Rule::unique('school_calendars', 'date')->where('school_id', $schoolId)->ignore($currentId),
            ],
            'day_type' => ['required', 'in:working,holiday,half_day,exam_day'],
            'label' => ['nullable', 'string', 'max:255'],
            'half_day_end_time' => ['required_if:day_type,half_day', 'nullable', 'date_format:H:i:s,H:i'],
        ];
    }
}
