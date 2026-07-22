<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AttendanceRecordResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $student = $this->owner;

        return [
            'id' => $this->id,
            'date' => $this->date->toDateString(),
            'in_time' => $this->in_time,
            'out_time' => $this->out_time,
            'status' => $this->status->value,
            'day_type' => $this->day_type->value,
            'late' => $this->late,
            'early_departure' => $this->early_departure,
            'source' => $this->source->value,
            'override_reason' => $this->override_reason,
            'student' => $student ? [
                'id' => $student->id,
                'first_name' => $student->first_name,
                'last_name' => $student->last_name,
                'admission_no' => $student->admission_no,
                'school_class' => $student->schoolClass ? [
                    'id' => $student->schoolClass->id,
                    'name' => $student->schoolClass->name,
                    'section' => $student->schoolClass->section,
                ] : null,
            ] : null,
        ];
    }
}
