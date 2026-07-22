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
        $owner = $this->owner;

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
            'owner_type' => $this->owner_type,
            'student' => $this->owner_type === 'student' && $owner ? [
                'id' => $owner->id,
                'first_name' => $owner->first_name,
                'last_name' => $owner->last_name,
                'admission_no' => $owner->admission_no,
                'school_class' => $owner->schoolClass ? [
                    'id' => $owner->schoolClass->id,
                    'name' => $owner->schoolClass->name,
                    'section' => $owner->schoolClass->section,
                ] : null,
            ] : null,
            'staff' => $this->owner_type === 'staff' && $owner ? [
                'id' => $owner->id,
                'name' => $owner->user->name,
                'designation' => $owner->designation,
            ] : null,
        ];
    }
}
