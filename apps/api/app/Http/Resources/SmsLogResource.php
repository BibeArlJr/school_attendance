<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SmsLogResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'recipient_phone' => $this->recipient_phone,
            'message' => $this->message,
            'status' => $this->status->value,
            'provider_response_code' => $this->provider_response_code,
            'provider_response_message' => $this->provider_response_message,
            'related_attendance_record_id' => $this->related_attendance_record_id,
            'sent_at' => $this->sent_at->toIso8601String(),
        ];
    }
}
