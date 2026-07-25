<?php

namespace App\Http\Resources;

use App\Modules\Student\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SmsLogResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Every SMS log is a parent-attendance notification, and every
        // owner it can ever point at is a student (Prompt 34 removed
        // staff attendance/scanning entirely, so a staff-owned record
        // can only be historical, pre-existing data) — but this stays
        // defensive rather than assuming: an owner_type='staff' or a
        // missing/deleted attendance record both fall through to null,
        // not an error (Prompt 36 Part A).
        $owner = $this->relatedAttendanceRecord?->owner;
        $student = $owner instanceof Student ? $owner : null;

        return [
            'id' => $this->id,
            'recipient_phone' => $this->recipient_phone,
            'message' => $this->message,
            'status' => $this->status->value,
            'provider_response_code' => $this->provider_response_code,
            'provider_response_message' => $this->provider_response_message,
            'related_attendance_record_id' => $this->related_attendance_record_id,
            'sent_at' => $this->sent_at->toIso8601String(),
            'student' => $student ? [
                'id' => $student->id,
                'uuid' => $student->uuid,
                'first_name' => $student->first_name,
                'last_name' => $student->last_name,
            ] : null,
        ];
    }
}
